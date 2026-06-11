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

  let title = movie?.title ?? '';
  let poster_url = movie?.poster_url ?? null;
  let backdrop_url = movie?.backdrop_url ?? null;
  let plot = movie?.plot ?? null;
  let year = movie?.year ?? null;
  let imdb_rating = movie?.imdb_rating ?? null;

  // If not found in DB and ID is numeric (TMDB ID), fetch from TMDB
  if (!movie && /^\d+$/.test(imdbId) && process.env.TMDB_API_KEY) {
    try {
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${imdbId}?api_key=${process.env.TMDB_API_KEY}`);
      if (tmdbRes.ok) {
        const tmdbData = await tmdbRes.json();
        title = tmdbData.title;
        poster_url = tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : null;
        backdrop_url = tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}` : null;
        plot = tmdbData.overview;
        year = tmdbData.release_date ? parseInt(tmdbData.release_date.split('-')[0]) : null;
        imdb_rating = tmdbData.vote_average;
      }
    } catch (err) {
      console.error("TMDB Fallback fetch error:", err);
    }
  }

  const payload: StreamEmbed = {
    sources: providers,
    title,
    type,
    imdbId,
    poster_url,
    backdrop_url,
    plot,
    cast_list:    movie?.cast_list    ?? null,
    genre_tags:   movie?.genre_tags   ?? null,
    year,
    director:     movie?.director     ?? null,
    runtime_min:  movie?.runtime_min  ?? null,
    imdb_rating,
  };

  return NextResponse.json(payload);
}
