import { NextRequest, NextResponse } from 'next/server';
import { searchOmdb } from '@/lib/omdb';
import { rateLimit } from '@/lib/ratelimit';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isUnrestrictedUser } from '@/lib/guards';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = 'https://image.tmdb.org/t/p/w342';

// Genres allowed for restricted users (matched against OMDB Genre string)
const RESTRICTED_GENRES = ['horror', 'thriller', 'sci-fi', 'science fiction', 'mystery'];

function isAllowedGenre(genreStr: string | undefined): boolean {
  if (!genreStr) return false;
  const lower = genreStr.toLowerCase();
  return RESTRICTED_GENRES.some(g => lower.includes(g));
}

/**
 * GET /api/omdb-search?q=...
 * Server-side proxy for OMDB title search.
 * Also handles `tmdb:12345` queries from pasted TMDB URLs.
 * The API keys never reach the browser.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  // Rate limit: 30 searches per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit(ip, 30, 60_000)) {
    return NextResponse.json(
      { error: 'Too many searches. Please slow down.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // Auth check — determine genre restriction for this user
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isUnrestricted = isUnrestrictedUser(user);

  // Handle TMDB ID lookup (from pasted TMDB URLs)
  const tmdbMatch = q.match(/^tmdb:(\d+)$/i);
  if (tmdbMatch) {
    const tmdbId = tmdbMatch[1];
    const key = process.env.TMDB_API_KEY;
    if (!key) return NextResponse.json([]);

    try {
      // Try movie first, then TV
      let res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${key}`, { next: { revalidate: 3600 } });
      let data = await res.json();
      let mediaType = 'movie';

      if (!data.id) {
        res = await fetch(`${TMDB_BASE}/tv/${tmdbId}?api_key=${key}`, { next: { revalidate: 3600 } });
        data = await res.json();
        mediaType = 'tv';
      }

      if (!data.id) return NextResponse.json([]);

      // For restricted users, check genres from TMDB
      if (!isUnrestricted) {
        const genres: string[] = (data.genres || []).map((g: { name: string }) => g.name.toLowerCase());
        const allowed = RESTRICTED_GENRES.some(r => genres.some(g => g.includes(r)));
        if (!allowed) return NextResponse.json([]);
      }

      const title = data.title ?? data.name ?? '';
      const year = (data.release_date ?? data.first_air_date ?? '').slice(0, 4);
      const poster = data.poster_path ? `${TMDB_IMG}${data.poster_path}` : null;

      // Try to get IMDb ID via /external_ids
      let imdbId = `tmdb-${tmdbId}`;
      try {
        const extRes = await fetch(
          `${TMDB_BASE}/${mediaType}/${tmdbId}/external_ids?api_key=${key}`,
          { next: { revalidate: 3600 } }
        );
        const extData = await extRes.json();
        if (extData.imdb_id) imdbId = extData.imdb_id;
      } catch { /* ignore */ }

      return NextResponse.json([{ imdbID: imdbId, title, year, poster }], {
        headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
      });
    } catch {
      return NextResponse.json([], { status: 500 });
    }
  }

  try {
    const results = await searchOmdb(q);
    // Note: OMDB search results don't include genre metadata — genre restriction is
    // enforced at the /api/add-movie level when full movie details are fetched.
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
