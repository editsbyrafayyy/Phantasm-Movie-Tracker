import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { OWNER_ID } from '@/lib/guards';

const ENTRY_FIELDS = [
  'id', 'user_id', 'movie_id', 'subgenre', 'secondary_tag', 'recommend',
  'atmosphere', 'story', 'characters', 'pacing', 'visuals', 'thrill', 'sound', 'impact',
  'bonus', 'total', 'must_watch', 'created_at', 'updated_at',
].join(', ');

const MOVIE_FIELDS = [
  'id', 'title', 'omdb_id', 'tmdb_id', 'poster_url', 'backdrop_url', 'year',
  'director', 'runtime_min', 'plot', 'imdb_rating', 'genre_tags', 'media_type',
].join(', ');

/**
 * GET /api/must-watch
 * Returns the owner's must-watch films. Uses service key (no user session),
 * so results are explicitly scoped to OWNER_USER_ID.
 * Public CDN cache: 2 min fresh, SWR up to 10 min.
 */
export async function GET() {
  if (!OWNER_ID) return NextResponse.json([]);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('entries')
    .select(`${ENTRY_FIELDS}, movie:movies(${MOVIE_FIELDS})`)
    .eq('user_id', OWNER_ID)
    .eq('must_watch', true)
    .order('total', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[GET /api/must-watch]', error);
    return NextResponse.json({ error: 'Failed to fetch must-watch films' }, { status: 500 });
  }
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' }
  });
}
