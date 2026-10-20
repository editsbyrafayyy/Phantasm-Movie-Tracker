import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/ratelimit';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const POSITIVE_INT_RE = /^[1-9]\d{0,9}$/;
const SEASON_RE = /^\d{1,4}$/; // Season 0 ("Specials") is a valid TMDB season

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; seasonNum: string }> }
) {
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API Key missing' }, { status: 500 });
  }

  const ip = getClientIp(req);
  if (!rateLimit(ip, 60, 60_000, 'GET /api/tmdb/tv/season')) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } }
    );
  }

  const { id, seasonNum } = await params;
  if (!POSITIVE_INT_RE.test(id) || !SEASON_RE.test(seasonNum)) {
    return NextResponse.json({ error: 'Invalid show or season' }, { status: 400 });
  }
  const tmdbUrl = `https://api.themoviedb.org/3/tv/${id}/season/${Number(seasonNum)}?api_key=${TMDB_API_KEY}`;

  try {
    const res = await fetch(tmdbUrl, { next: { revalidate: 86400 } });
    if (!res.ok) {
      const status = res.status === 404 ? 404 : 502;
      return NextResponse.json({ error: 'Failed to fetch season details' }, { status });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err) {
    console.error('[TMDB API] Error fetching season detail:', err);
    return NextResponse.json({ error: 'Failed to fetch season details' }, { status: 500 });
  }
}
