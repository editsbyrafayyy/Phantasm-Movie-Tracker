import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { StreamEmbed } from '@/lib/types';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/stream/[imdbId]
 * Resolves streaming embed URLs for a given IMDB ID.
 * Looks up media_type in the movies table so the embed path is correct
 * for both movies and TV series. Returns sources, title, type, and all
 * metadata fields so the sidebar can be populated.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ imdbId: string }> }
) {
  const { imdbId } = await params;

  if (!imdbId) {
    return NextResponse.json({ error: 'Missing imdbId' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: movie } = await supabase
    .from('movies')
    .select('media_type, title, imdb_rating, poster_url, backdrop_url, plot, cast_list, genre_tags, year, director, runtime_min')
    .eq('omdb_id', imdbId)
    .maybeSingle();

  const type: 'movie' | 'tv' = movie?.media_type === 'tv' ? 'tv' : 'movie';

  const sources = [
    { name: 'VidSrc Pro',    url: `https://vidsrc.me/embed/${type}?imdb=${imdbId}` },
    { name: 'VidSrc Net',    url: `https://vidsrc.net/embed/${type}?imdb=${imdbId}` },
    { name: 'VidSrc To',     url: `https://vidsrc.to/embed/${type}/${imdbId}` },
    { name: 'AutoEmbed',     url: `https://player.autoembed.cc/embed/${type}/${imdbId}` },
    { name: 'SuperEmbed',    url: `https://multiembed.mov/?video_id=${imdbId}&tmdb=0` },
    { name: 'EmbedSu',       url: `https://embed.su/embed/${type}/${imdbId}` },
  ];

  const payload: StreamEmbed = {
    sources,
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
