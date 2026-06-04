import { NextRequest, NextResponse } from 'next/server';
import { searchOmdb } from '@/lib/omdb';

/**
 * GET /api/omdb-search?q=...
 * Server-side proxy for OMDB title search.
 * The OMDB API key never reaches the browser.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchOmdb(q);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
