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
 * for both movies and TV series. Returns primary (vidsrc.to) and
 * fallback (embed.su) URLs along with title and type metadata.
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
    .select('media_type, title')
    .eq('omdb_id', imdbId)
    .maybeSingle();

  const type: 'movie' | 'tv' = movie?.media_type === 'tv' ? 'tv' : 'movie';
  
  const sources = [
    { name: 'Server 1 (VidSrc ME)', url: `https://vidsrc.me/embed/${type}?imdb=${imdbId}` },
    { name: 'Server 2 (VidSrc NET)', url: `https://vidsrc.net/embed/${type}?imdb=${imdbId}` },
    { name: 'Server 3 (SuperEmbed)', url: type === 'movie' ? `https://multiembed.mov/?video_id=${imdbId}&tmdb=0` : `https://multiembed.mov/?video_id=${imdbId}&tmdb=0` },
    { name: 'Server 4 (AutoEmbed)', url: `https://player.autoembed.cc/embed/${type}/${imdbId}` }
  ];

  const payload: StreamEmbed = {
    sources,
    title:  movie?.title ?? '',
    type,
    imdbId,
  };

  return NextResponse.json(payload);
}
