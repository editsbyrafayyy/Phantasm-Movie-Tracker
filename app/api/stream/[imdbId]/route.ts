import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProvidersInOrder } from '@/lib/providers';
import type { StreamEmbed } from '@/lib/types';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ imdbId: string }> }
) {
  const { imdbId } = await params;

  if (!imdbId) {
    return NextResponse.json({ error: 'Missing imdbId' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const season = parseInt(searchParams.get('s') ?? '1', 10);
  const episode = parseInt(searchParams.get('e') ?? '1', 10);

  const supabase = createServiceClient();
  const { data: movie } = await supabase
    .from('movies')
    .select('id, media_type, title, imdb_rating, poster_url, backdrop_url, plot, cast_list, genre_tags, year, director, runtime_min, tmdb_id')
    .eq('omdb_id', imdbId)
    .maybeSingle();

  const type: 'movie' | 'tv' = movie?.media_type === 'tv' ? 'tv' : 'movie';
  const tmdbIdStr = movie?.tmdb_id ? String(movie.tmdb_id) : undefined;

  const providers = getProvidersInOrder().map(p => ({
    name: p.name,
    url: type === 'tv' 
      ? p.tvUrl(imdbId, season, episode, tmdbIdStr) 
      : p.movieUrl(imdbId, tmdbIdStr)
  }));

  const payload: StreamEmbed = {
    sources: providers,
    title:        movie?.title ?? '',
    type,
    imdbId,
    poster_url:   movie?.poster_url   ?? null,
    backdrop_url: movie?.backdrop_url ?? null,
    plot:         movie?.plot         ?? null,
    cast_list:    movie?.cast_list    ?? null,
    genre_tags:   movie?.genre_tags   ?? null,
    year:         movie?.year         ?? null,
    director:     movie?.director     ?? null,
    runtime_min:  movie?.runtime_min  ?? null,
    imdb_rating:  movie?.imdb_rating  ?? null,
  };

  return NextResponse.json(payload);
}
