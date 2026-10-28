/**
 * lib/dares.ts — "Dare me to watch" screening and anti-abuse helpers.
 * SERVER-SIDE ONLY (TMDB key, signing secret, service client).
 *
 * A dare can only ever name a TMDB movie id: titles and posters are fetched here,
 * never taken from the visitor, so no free text reaches the database or the page.
 */
import { createHmac, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

const TMDB = 'https://api.themoviedb.org/3';

/** At least one of these is required… */
const ALLOWED_GENRES: Record<number, string> = { 27: 'Horror', 53: 'Thriller', 878: 'Science Fiction' };
/** …and none of these: Animation, Documentary, Music, Romance, Family, TV Movie. */
const BLOCKED_GENRES = new Set([16, 99, 10402, 10749, 10751, 10770]);
const HORROR = 27;
const COMEDY = 35; // only as horror-comedy
/** Obscure titles are where the shock/exploitation catalogue lives — require some audience. */
const MIN_VOTES = 50;
/** Adult-only certifications in any country. */
const BLOCKED_CERTS = new Set(['NC-17', 'X', 'XX', 'XXX', 'R18', 'R18+', 'X18', 'X18+', 'X 18+', 'R21']);
/**
 * TMDB keywords that mark sexual, sexually violent or real-death shock content.
 * Whole words only (so "rape" never matches "skyscraper"). Non-sexual dark themes
 * like "child abuse" are left alone — they tag mainstream classics (The Shining).
 */
const BLOCKED_KEYWORDS = new RegExp('\\b(' + [
  'erotic\\w*', 'softcore', 'hardcore', 'sexploitation', 'porn\\w*', 'hentai', 'adult film', 'sex film',
  'incest\\w*', 'rape', 'raped', 'rapist', 'sexual (?:assault|abuse|violence)', 'p(?:a)?edophil\\w*',
  'child molest\\w*', 'child sexual abuse', 'bestiality', 'zoophilia', 'necrophilia', 'snuff(?: film)?',
  'nazisploitation', 'shockumentary', 'mondo film', 'real death',
].join('|') + ')\\b', 'i');

export const DARE_LIMITS = {
  perHour: 3,
  perDay: 8,
  globalPerDay: 100,
  maxPending: 300,
  /** Token must be at least this old (humans take a moment; scripts don't). */
  minTokenAgeMs: 3000,
  maxTokenAgeMs: 2 * 60 * 60 * 1000,
};

export interface DareFilm {
  id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
  genres: string[];
}

const today = () => new Date().toISOString().slice(0, 10);

export function genresAllowed(ids: number[]): boolean {
  if (!ids.some(id => id in ALLOWED_GENRES)) return false;
  if (ids.some(id => BLOCKED_GENRES.has(id))) return false;
  if (ids.includes(COMEDY) && !ids.includes(HORROR)) return false;
  return true;
}

/** Cheap pre-filter on a TMDB search hit (full screening still runs on the detail). */
export function searchHitAllowed(hit: { adult?: boolean; genre_ids?: number[]; vote_count?: number; release_date?: string }): boolean {
  return !hit.adult
    && genresAllowed(hit.genre_ids ?? [])
    && (hit.vote_count ?? 0) >= MIN_VOTES
    && !!hit.release_date && hit.release_date <= today();
}

interface TmdbDetail {
  id?: number;
  title?: string;
  adult?: boolean;
  release_date?: string;
  vote_count?: number;
  poster_path?: string | null;
  genres?: { id: number; name: string }[];
  keywords?: { keywords?: { name: string }[] };
  release_dates?: { results?: { release_dates?: { certification?: string }[] }[] };
}

/**
 * Full check of one movie: released, not adult, allowed genres only, no adult
 * certification anywhere, no blocked keywords. Null means "can't be dared".
 */
export async function screenFilm(tmdbId: number): Promise<DareFilm | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key || !Number.isInteger(tmdbId) || tmdbId <= 0) return null;
  try {
    const res = await fetch(
      `${TMDB}/movie/${tmdbId}?api_key=${key}&append_to_response=keywords,release_dates`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const d = (await res.json()) as TmdbDetail;
    if (!d.id || !d.title || d.adult) return null;

    const genreIds = (d.genres ?? []).map(g => g.id);
    if (!searchHitAllowed({ adult: d.adult, genre_ids: genreIds, vote_count: d.vote_count, release_date: d.release_date })) return null;

    const certs = (d.release_dates?.results ?? [])
      .flatMap(r => r.release_dates ?? [])
      .map(r => (r.certification ?? '').trim().toUpperCase())
      .filter(Boolean);
    if (certs.some(c => BLOCKED_CERTS.has(c) || c.includes('XXX'))) return null;

    const keywords = (d.keywords?.keywords ?? []).map(k => k.name.toLowerCase());
    if (keywords.some(k => BLOCKED_KEYWORDS.test(k))) return null;

    return {
      id: d.id,
      title: d.title.slice(0, 200),
      year: Number(d.release_date!.slice(0, 4)) || null,
      poster_path: d.poster_path && /^\/[\w.-]+$/.test(d.poster_path) ? d.poster_path : null,
      genres: (d.genres ?? []).map(g => g.name).slice(0, 6),
    };
  } catch {
    return null;
  }
}

/** TMDB ids (from `ids`) the owner has already rated. */
export async function ownerRatedTmdbIds(ids: number[]): Promise<Set<number>> {
  const owner = process.env.OWNER_USER_ID;
  if (!owner || !ids.length) return new Set();
  const service = createServiceClient();
  const { data: movies } = await service.from('movies').select('id, tmdb_id').in('tmdb_id', ids);
  if (!movies?.length) return new Set();
  const { data: entries } = await service
    .from('entries')
    .select('movie_id')
    .eq('user_id', owner)
    .in('movie_id', movies.map(m => m.id));
  const rated = new Set((entries ?? []).map(e => e.movie_id));
  return new Set(movies.filter(m => rated.has(m.id)).map(m => m.tmdb_id as number));
}

// ── Visitor identity + form token ───────────────────────────────────────────
function secret(): string {
  const s = process.env.DARE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('DARE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) must be set');
  return s;
}

/** Salted, non-reversible visitor key — raw IPs are never stored. */
export function hashIp(ip: string): string {
  return createHmac('sha256', secret()).update(`ip:${ip}`).digest('hex').slice(0, 40);
}

const sign = (issued: number, ipHash: string) =>
  createHmac('sha256', secret()).update(`dare:${issued}:${ipHash}`).digest('hex');

/** A signed timestamp bound to the visitor, issued when they start using the form. */
export function issueDareToken(ipHash: string, now = Date.now()): string {
  return `${now}.${sign(now, ipHash)}`;
}

export function checkDareToken(token: unknown, ipHash: string, now = Date.now()): 'ok' | 'too-fast' | 'invalid' {
  if (typeof token !== 'string' || token.length > 120) return 'invalid';
  const [ts, sig] = token.split('.');
  const issued = Number(ts);
  if (!Number.isSafeInteger(issued) || !sig) return 'invalid';
  const expected = sign(issued, ipHash);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return 'invalid';
  const age = now - issued;
  if (age < DARE_LIMITS.minTokenAgeMs) return 'too-fast';
  if (age > DARE_LIMITS.maxTokenAgeMs) return 'invalid';
  return 'ok';
}
