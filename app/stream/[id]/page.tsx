import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import VideoPlayerClient from '@/components/stream/VideoPlayerClient';
import { getProvidersInOrder } from '@/lib/providers';
import { fetchTmdbDetail, findTmdbByImdbId, getTrendingHorror } from '@/lib/tmdb';
import type { TmdbMovieDetail } from '@/lib/tmdb';
import type { Movie } from '@/lib/types';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string; e?: string }>;
};

export default async function WatchPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sParams = await searchParams;
  const season = parseInt(sParams.s ?? '1', 10);
  const episode = parseInt(sParams.e ?? '1', 10);

  // Auth check — streaming is members only
  const authClient = await createServerSupabaseClient();
  const { data: { session } } = await authClient.auth.getSession();
  if (!session) redirect('/login?next=/stream/' + id);

  const supabase = createServiceClient();
  let movie: Movie | null = null;
  let imdbId = '';
  let tmdbId: number | null = null;
  let mediaType: 'movie' | 'tv' = 'movie';
  let subgenre: string | null = null;

  // 1. Resolve IDs and fetch database entry if it exists
  const isImdb = id.startsWith('tt');

  if (isImdb) {
    imdbId = id;
    const { data } = await supabase
      .from('movies')
      .select('*')
      .eq('omdb_id', imdbId)
      .maybeSingle();
    movie = data as Movie | null;
  } else {
    tmdbId = parseInt(id, 10);
    if (isNaN(tmdbId)) notFound();
    const { data } = await supabase
      .from('movies')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .maybeSingle();
    movie = data as Movie | null;
  }

  if (movie) {
    imdbId = movie.omdb_id ?? imdbId;
    tmdbId = movie.tmdb_id ?? tmdbId;
    mediaType = movie.media_type === 'tv' ? 'tv' : 'movie';

    // Fetch subgenre from entries table
    const { data: entries } = await supabase
      .from('entries')
      .select('subgenre')
      .eq('movie_id', movie.id)
      .limit(1);
    if (entries && entries.length > 0) {
      subgenre = entries[0].subgenre;
    }
  } else if (!isImdb) {
    tmdbId = parseInt(id, 10);
    if (isNaN(tmdbId)) notFound();
  }

  // 2. Fetch TMDB details dynamically if movie isn't in database, or to enrich details
  let tmdbDetail: TmdbMovieDetail | null = null;
  let trailerKey = '';
  let productionCompany = '';
  let status = 'Released';
  let releaseDate = '';

  if (tmdbId) {
    tmdbDetail = await fetchTmdbDetail(tmdbId, mediaType);
  } else if (isImdb) {
    const found = await findTmdbByImdbId(imdbId);
    if (found) {
      tmdbId = found.result.id;
      mediaType = found.type;
      tmdbDetail = await fetchTmdbDetail(tmdbId, mediaType);
    }
  }

  // 3. Extract TMDB detailed metadata
  if (tmdbDetail) {
    status = tmdbDetail.status ?? 'Released';
    releaseDate = tmdbDetail.release_date ?? tmdbDetail.first_air_date ?? '';
    if (tmdbDetail.production_companies && tmdbDetail.production_companies.length > 0) {
      productionCompany = tmdbDetail.production_companies[0].name;
    }
    const videos = tmdbDetail.videos?.results ?? [];
    const trailer = videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube')
      || videos.find((v) => v.site === 'YouTube');
    if (trailer) {
      trailerKey = trailer.key;
    }
  }

  // 4. Fallback to basic database fields
  const title = movie?.title ?? tmdbDetail?.title ?? tmdbDetail?.name ?? 'Unknown Title';
  const plot = movie?.plot ?? tmdbDetail?.overview ?? null;
  const rating = movie?.imdb_rating ?? tmdbDetail?.vote_average ?? null;
  const posterUrl = movie?.poster_url ?? (tmdbDetail?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbDetail.poster_path}` : null);
  const backdropUrl = movie?.backdrop_url ?? (tmdbDetail?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbDetail.backdrop_path}` : null);
  const year = movie?.year ?? (releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : null);
  const runtime = movie?.runtime_min ?? tmdbDetail?.runtime ?? null;
  const director = movie?.director ?? null;

  const castList = tmdbDetail?.credits?.cast
    ?.sort((a, b) => a.order - b.order)
    .slice(0, 8)
    .map((c) => ({
      name: c.name,
      character: c.character,
      profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
    })) ?? movie?.cast_list ?? [];

  const genreTags = movie?.genre_tags ?? tmdbDetail?.genres?.map((g: { name: string }) => g.name) ?? [];

  // 5. Construct URL sources list
  const tmdbIdStr = tmdbId ? String(tmdbId) : undefined;
  const providers = getProvidersInOrder().map(p => ({
    id: p.id,
    name: p.name,
    url: mediaType === 'tv' 
      ? p.tvUrl(imdbId || String(tmdbId), season, episode, tmdbIdStr) 
      : p.movieUrl(imdbId || String(tmdbId), tmdbIdStr)
  }));

  // 6. Fetch related/similar movies for the chevrons playlist
  let similarIds: string[] = [];
  
  if (subgenre) {
    const { data: similarEntries } = await supabase
      .from('entries')
      .select('*, movie:movies(*)')
      .eq('subgenre', subgenre)
      .limit(10);
      
    if (similarEntries) {
      similarIds = similarEntries
        .map(e => e.movie.omdb_id || String(e.movie.tmdb_id))
        .filter(val => val && val !== id);
    }
  }

  if (similarIds.length === 0) {
    const trending = await getTrendingHorror();
    similarIds = trending.map((m) => String(m.id)).filter(val => val !== id);
  }

  const playlist = [id, ...similarIds];

  return (
    <VideoPlayerClient
      sources={providers}
      title={title}
      type={mediaType}
      imdbId={imdbId}
      tmdbId={tmdbIdStr}
      poster_url={posterUrl}
      backdrop_url={backdropUrl}
      plot={plot}
      cast_list={castList}
      genre_tags={genreTags}
      year={year}
      director={director}
      runtime_min={runtime}
      imdb_rating={rating}
      status={status}
      production={productionCompany}
      aired={releaseDate}
      trailerKey={trailerKey}
      playlist={playlist}
      currentId={id}
      season={season}
      episode={episode}
    />
  );
}
