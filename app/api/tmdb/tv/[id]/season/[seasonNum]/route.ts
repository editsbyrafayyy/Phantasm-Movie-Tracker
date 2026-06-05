import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; seasonNum: string }> }
) {
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API Key missing' }, { status: 500 });
  }

  const { id, seasonNum } = await params;
  const tmdbUrl = `https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}?api_key=${TMDB_API_KEY}`;

  try {
    const res = await fetch(tmdbUrl, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json({ error: `TMDB error: ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[TMDB API] Error fetching season detail:', err);
    return NextResponse.json({ error: 'Failed to fetch season details' }, { status: 500 });
  }
}
