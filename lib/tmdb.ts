/**
 * lib/tmdb.ts — TMDB API wrapper
 *
 * SECURITY: This file is SERVER-SIDE ONLY.
 * - TMDB_API_KEY has no NEXT_PUBLIC_ prefix — the browser NEVER sees it.
 * - Only import this file in API routes, server components, or scripts.
 * - If you accidentally import this in a 'use client' component, Next.js will throw.
 *
 * On Vercel: Add TMDB_API_KEY in Project → Settings → Environment Variables.
 */

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = 'https://image.tmdb.org/t/p';

function getKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    // In development this will throw early. In production Vercel will have it set.
    throw new Error('TMDB_API_KEY is not set. Add it to .env.local and Vercel env vars.');
  }
  return key;
}

// ── Type Definitions ──────────────────────────────────────────────────────────

export interface TmdbSearchResult {
  id:            number;
  title?:        string;   // movies
  name?:         string;   // TV shows
  release_date?: string;
  first_air_date?:string;
  backdrop_path: string | null;
  poster_path:   string | null;
  media_type?:   string;
}

export interface TmdbCastMember {
  id:           number;
  name:         string;
  character:    string;
  profile_path: string | null;
  order:        number;
}

export interface TmdbMovieDetail extends TmdbSearchResult {
  runtime?:     number;
  status?:      string;
  production_companies?: { name: string; id: number; logo_path: string | null }[];
  overview?:    string;
  vote_average?: number;
  genres?:      { id: number; name: string }[];
  videos?: {
    results: { key: string; type: string; site: string }[];
  };
  credits?: {
    cast: TmdbCastMember[];
  };
  external_ids?: {
    imdb_id?: string | null;
  };
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: {
    air_date?: string;
    episode_count?: number;
    id: number;
    name: string;
    overview?: string;
    poster_path?: string | null;
    season_number: number;
    vote_average?: number;
  }[];
}

// ── Image URL Helpers ─────────────────────────────────────────────────────────

/** Returns a full backdrop URL (1280px wide) or null */
export function tmdbBackdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
  return path ? `${TMDB_IMG}/${size}${path}` : null;
}

/** Returns a full poster URL or null */
export function tmdbPosterUrl(path: string | null, size: 'w342' | 'w500' | 'original' = 'w500'): string | null {
  return path ? `${TMDB_IMG}/${size}${path}` : null;
}

/** Returns a full profile image URL or null */
export function tmdbProfileUrl(path: string | null): string | null {
  return path ? `${TMDB_IMG}/w185${path}` : null;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Search TMDB for a movie/show by title and optional year.
 * Returns the best match or null.
 */
export async function searchTmdb(
  title: string,
  year?: number,
  type: 'movie' | 'tv' = 'movie'
): Promise<TmdbSearchResult | null> {
  try {
    const key = getKey();
    const params = new URLSearchParams({
      api_key: key,
      query:   title,
      ...(year ? { [type === 'movie' ? 'year' : 'first_air_date_year']: String(year) } : {}),
    });
    let res  = await fetch(`${TMDB_BASE}/search/${type}?${params}`, { next: { revalidate: 86400 } });
    let data = await res.json();
    if (data.results?.[0]) {
      return data.results[0] as TmdbSearchResult;
    }

    // Fallback: search without year if search with year failed
    if (year) {
      const fallbackParams = new URLSearchParams({
        api_key: key,
        query:   title,
      });
      res  = await fetch(`${TMDB_BASE}/search/${type}?${fallbackParams}`, { next: { revalidate: 86400 } });
      data = await res.json();
      return (data.results?.[0] as TmdbSearchResult) ?? null;
    }

    return null;
  } catch (err) {
    console.error('[TMDB] searchTmdb error:', err);
    return null;
  }
}

/**
 * Find a movie or TV show by its IMDb ID.
 */
export async function findTmdbByImdbId(
  imdbId: string
): Promise<{ result: TmdbSearchResult; type: 'movie' | 'tv' } | null> {
  try {
    const key = getKey();
    const params = new URLSearchParams({
      api_key:         key,
      external_source: 'imdb_id',
    });
    const res = await fetch(`${TMDB_BASE}/find/${imdbId}?${params}`, { next: { revalidate: 86400 } });
    const data = await res.json();

    if (data.movie_results?.[0]) {
      return {
        result: data.movie_results[0] as TmdbSearchResult,
        type: 'movie',
      };
    }
    if (data.tv_results?.[0]) {
      return {
        result: data.tv_results[0] as TmdbSearchResult,
        type: 'tv',
      };
    }
    return null;
  } catch (err) {
    console.error('[TMDB] findTmdbByImdbId error:', err);
    return null;
  }
}

/**
 * Fetch full TMDB detail (includes credits/cast) for a movie or TV show by TMDB ID.
 */
export async function fetchTmdbDetail(
  tmdbId: number,
  type: 'movie' | 'tv' = 'movie'
): Promise<TmdbMovieDetail | null> {
  try {
    const key = getKey();
    const res  = await fetch(
      `${TMDB_BASE}/${type}/${tmdbId}?api_key=${key}&append_to_response=credits,videos,external_ids`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    return data as TmdbMovieDetail;
  } catch (err) {
    console.error('[TMDB] fetchTmdbDetail error:', err);
    return null;
  }
}

/**
 * Convenience: find by IMDb ID, or search then fetch detail.
 * Returns { backdrop_url, poster_url, tmdb_id, cast_list } or nulls.
 */
export async function enrichFromTmdb(
  title: string,
  year?: number,
  type: 'movie' | 'tv' = 'movie',
  imdbId?: string | null
): Promise<{
  tmdb_id:      number | null;
  backdrop_url: string | null;
  poster_url:   string | null;
  cast_list:    { name: string; profile_path: string | null }[] | null;
  media_type:   'movie' | 'tv' | null;
}> {
  let result: TmdbSearchResult | null = null;
  let resolvedType = type;

  // 1. Try matching by IMDb ID first
  if (imdbId) {
    const found = await findTmdbByImdbId(imdbId);
    if (found) {
      result = found.result;
      resolvedType = found.type;
    }
  }

  // 2. Fallback to title & year search
  if (!result) {
    result = await searchTmdb(title, year, type);
    if (!result && type === 'movie') {
      const tvResult = await searchTmdb(title, year, 'tv');
      if (tvResult) {
        result = tvResult;
        resolvedType = 'tv';
      }
    }
  }

  if (!result) return { tmdb_id: null, backdrop_url: null, poster_url: null, cast_list: null, media_type: null };

  const detail = await fetchTmdbDetail(result.id, resolvedType);

  const cast_list = detail?.credits?.cast
    ?.sort((a, b) => a.order - b.order)
    .slice(0, 8)
    .map(c => ({
      name: c.name,
      character: c.character,
      profile_path: tmdbProfileUrl(c.profile_path)
    })) ?? null;

  return {
    tmdb_id:      result.id,
    backdrop_url: tmdbBackdropUrl(result.backdrop_path),
    poster_url:   tmdbPosterUrl(result.poster_path),
    cast_list,
    media_type:   resolvedType,
  };
}

// ── Horror / Thriller Discovery ───────────────────────────────────────────────

export interface TmdbDiscoverMovie {
  id:            number;
  title?:        string;
  name?:         string;
  poster_path:   string | null;
  backdrop_path: string | null;
  vote_average:  number;
  release_date?: string;
  first_air_date?: string;
  overview:      string;
}

// TMDB genre IDs: Horror = 27, Thriller = 53
const HORROR_GENRE_IDS = '27,53';

export async function getTrendingHorror(): Promise<TmdbDiscoverMovie[]> {
  try {
    const key = getKey();
    const res = await fetch(
      `${TMDB_BASE}/discover/movie?api_key=${key}&with_genres=${HORROR_GENRE_IDS}&sort_by=popularity.desc&page=1&language=en-US`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return (data.results ?? []) as TmdbDiscoverMovie[];
  } catch { return []; }
}

export async function getTopRatedHorror(): Promise<TmdbDiscoverMovie[]> {
  try {
    const key = getKey();
    const res = await fetch(
      `${TMDB_BASE}/discover/movie?api_key=${key}&with_genres=${HORROR_GENRE_IDS}&sort_by=vote_average.desc&vote_count.gte=200&page=1&language=en-US`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return (data.results ?? []) as TmdbDiscoverMovie[];
  } catch { return []; }
}

export async function getRecentHorror(): Promise<TmdbDiscoverMovie[]> {
  try {
    const key = getKey();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const fromDate = sixMonthsAgo.toISOString().slice(0, 10);
    const res = await fetch(
      `${TMDB_BASE}/discover/movie?api_key=${key}&with_genres=${HORROR_GENRE_IDS}&sort_by=release_date.desc&primary_release_date.gte=${fromDate}&page=1&language=en-US`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return (data.results ?? []) as TmdbDiscoverMovie[];
  } catch { return []; }
}

export async function getClassicHorror(): Promise<TmdbDiscoverMovie[]> {
  try {
    const key = getKey();
    const res = await fetch(
      `${TMDB_BASE}/discover/movie?api_key=${key}&with_genres=${HORROR_GENRE_IDS}&primary_release_date.lte=1999-12-31&sort_by=vote_average.desc&vote_count.gte=150&page=1&language=en-US`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return (data.results ?? []) as TmdbDiscoverMovie[];
  } catch { return []; }
}

export async function getHiddenGemsHorror(): Promise<TmdbDiscoverMovie[]> {
  try {
    const key = getKey();
    const res = await fetch(
      `${TMDB_BASE}/discover/movie?api_key=${key}&with_genres=${HORROR_GENRE_IDS}&vote_average.gte=6.5&vote_count.lte=300&sort_by=vote_average.desc&page=1&language=en-US`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return (data.results ?? []) as TmdbDiscoverMovie[];
  } catch { return []; }
}

/**
 * Returns upcoming horror/thriller films releasing between today and Dec 31, 2026.
 * Sorted by popularity descending, limited to 12. Cached for 6 hours.
 */
export async function getComingSoonHorror(): Promise<TmdbDiscoverMovie[]> {
  try {
    const key   = getKey();
    const today = new Date().toISOString().split('T')[0];
    const end   = '2026-12-31';

    const url = `${TMDB_BASE}/discover/movie?api_key=${key}`
      + `&with_genres=27,53`
      + `&primary_release_date.gte=${today}`
      + `&primary_release_date.lte=${end}`
      + `&sort_by=popularity.desc`
      + `&vote_count.gte=0`
      + `&language=en-US`
      + `&page=1`;

    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    const data = await res.json();

    const results: TmdbDiscoverMovie[] = (data.results ?? [])
      .filter((m: TmdbDiscoverMovie) => m.poster_path)
      .slice(0, 12);

    return results;
  } catch { return []; }
}

