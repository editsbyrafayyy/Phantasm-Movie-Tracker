import { NextRequest, NextResponse } from 'next/server';
import { searchOmdb } from '@/lib/omdb';

/**
 * GET /api/omdb-search?q=...
 * Server-side proxy for OMDB title search.
 * The OMDB API key never reaches the browser.
 * Cache-Control: public 1h — search results for a given title are stable.
 * Vary on the URL so distinct queries get distinct cache entries.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json([]);
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
