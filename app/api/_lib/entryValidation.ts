// Shared input validation + movie-row helpers for the add-movie and movies/[id] routes.
// Lives in a private (`_`-prefixed) folder so Next.js never treats it as a route.
import type { createServiceClient } from '@/lib/supabase/server';
import { SUBGENRES, SECONDARY_TAGS } from '@/lib/config';

export const RECOMMEND_VALUES = ['Yes', 'No', 'Peak', 'Garbage'] as const;

const IMDB_ID_RE = /^tt\d{5,10}$/;
// Legacy references produced by the TMDB paste flow in AddMovieForm / omdb-search
const TMDB_REF_RE = /^tmdb[:-]\d{1,10}$/;

const MAX_CUSTOM_TAGS = 20;
const MAX_CUSTOM_TAG_LEN = 40;

export function isValidImdbId(id: string): boolean {
  return IMDB_ID_RE.test(id);
}

/** Accepts a real IMDb ID or the legacy `tmdb:123` / `tmdb-123` reference. */
export function isAcceptableMovieRef(id: unknown): id is string {
  return typeof id === 'string' && (IMDB_ID_RE.test(id) || TMDB_REF_RE.test(id));
}

/** Escape LIKE/ILIKE wildcards so user titles are matched literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, ch => `\\${ch}`);
}

export function isValidSubgenre(v: unknown): boolean {
  return typeof v === 'string' && (SUBGENRES as readonly string[]).includes(v);
}

/** '' / null / undefined allowed; otherwise each comma-separated tag must be known. */
export function isValidSecondaryTag(v: unknown): boolean {
  if (v === '' || v === null || v === undefined) return true;
  if (typeof v !== 'string' || v.length > 300) return false;
  return v
    .split(',')
    .map(t => t.trim())
    .every(t => (SECONDARY_TAGS as readonly string[]).includes(t));
}

export function isValidRecommend(v: unknown): boolean {
  if (v === '' || v === null || v === undefined) return true;
  return typeof v === 'string' && (RECOMMEND_VALUES as readonly string[]).includes(v);
}

export function isValidBonus(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  const n = Number(v);
  return n === 0 || n === 1;
}

/** Returns a cleaned tag list, or null if the input is invalid. */
export function sanitizeCustomTags(v: unknown): string[] | null {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > MAX_CUSTOM_TAGS) return null;
  const out: string[] = [];
  for (const raw of v) {
    if (typeof raw !== 'string') return null;
    const tag = raw.trim();
    if (!tag) continue;
    if (tag.length > MAX_CUSTOM_TAG_LEN) return null;
    if (!out.includes(tag)) out.push(tag);
  }
  return out;
}

/**
 * Inserts a movies row; if a concurrent request already inserted the same
 * omdb_id / tmdb_id (unique violation 23505), returns the existing row's id.
 */
export async function insertMovieOrGetExisting(
  serviceClient: ReturnType<typeof createServiceClient>,
  payload: { omdb_id?: string | null; tmdb_id?: number | null } & Record<string, unknown>
): Promise<string | null> {
  const { data, error } = await serviceClient
    .from('movies')
    .insert(payload)
    .select('id')
    .single();

  if (!error && data) return data.id as string;

  if (error?.code === '23505') {
    if (payload.omdb_id) {
      const { data: rows } = await serviceClient
        .from('movies').select('id').eq('omdb_id', payload.omdb_id).limit(1);
      if (rows?.[0]) return rows[0].id as string;
    }
    if (payload.tmdb_id) {
      const { data: rows } = await serviceClient
        .from('movies').select('id').eq('tmdb_id', payload.tmdb_id).limit(1);
      if (rows?.[0]) return rows[0].id as string;
    }
  }

  console.error('movies insert error', error);
  return null;
}
