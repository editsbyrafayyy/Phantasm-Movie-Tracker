import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import { ownerRatedTmdbIds, screenFilm, searchHitAllowed } from '@/lib/dares';

/**
 * GET ?q= — public film search for the dare box. Movies only, and only titles that
 * pass the full dare screening (genre, adult flags, certifications, keywords).
 */
export async function GET(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 20, 60_000, 'GET /api/dares/search')) {
    return NextResponse.json({ error: 'Too many searches. Slow down.' }, { status: 429 });
  }
  const q = (req.nextUrl.searchParams.get('q') ?? '').replace(/[\u0000-\u001f]/g, '').trim();
  if (q.length < 2 || q.length > 60) return NextResponse.json([]);

  const key = process.env.TMDB_API_KEY;
  if (!key) return NextResponse.json([]);

  try {
    const params = new URLSearchParams({ api_key: key, query: q, include_adult: 'false', page: '1' });
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json([]);
    const { results = [] } = (await res.json()) as { results?: { id: number; adult?: boolean; genre_ids?: number[]; vote_count?: number; release_date?: string }[] };

    const candidates = results.filter(searchHitAllowed).slice(0, 6);
    const screened = (await Promise.all(candidates.map(c => screenFilm(c.id)))).filter(f => f !== null);
    const rated = await ownerRatedTmdbIds(screened.map(f => f.id));

    return NextResponse.json(
      screened.map(f => ({
        id: f.id,
        title: f.title,
        year: f.year,
        poster: f.poster_path ? `https://image.tmdb.org/t/p/w185${f.poster_path}` : null,
        rated: rated.has(f.id),
      })),
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600' } },
    );
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
