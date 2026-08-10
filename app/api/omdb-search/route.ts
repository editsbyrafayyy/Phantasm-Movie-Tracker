import { NextRequest, NextResponse } from 'next/server';
import { searchOmdb } from '@/lib/omdb';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = 'https://image.tmdb.org/t/p/w342';

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
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
