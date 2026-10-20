import { notFound } from 'next/navigation';
import { fetchTmdbDetail } from '@/lib/tmdb';
import StreamDetailV3 from '@/components/stream/StreamDetailV3';

type Props = {
  params: Promise<{ tmdbId: string }>;
  searchParams: Promise<{ type?: string }>;
};

/** True when the (ISO) date is in the future. Evaluated per request on the server. */
function isFutureDate(date?: string): boolean {
  if (!date) return false;
  const t = new Date(date).getTime();
  return Number.isFinite(t) && t > Date.now();
}

export default async function TmdbDetailPage({ params, searchParams }: Props) {
  const { tmdbId } = await params;
  const sParams = await searchParams;
  const id = parseInt(tmdbId, 10);
  if (isNaN(id)) notFound();

  const type = sParams.type === 'tv' ? 'tv' : 'movie';
  const movie = await fetchTmdbDetail(id, type);
  if (!movie) notFound();

  const imdbId = movie.external_ids?.imdb_id ?? null;
  const isComingSoon = isFutureDate(movie.release_date || movie.first_air_date);

  return (
    <StreamDetailV3
      movie={movie}
      imdbId={imdbId}
      mediaType={type}
      isComingSoon={isComingSoon}
    />
  );
}
