import { notFound } from 'next/navigation';
import { fetchTmdbDetail } from '@/lib/tmdb';
import StreamDetailV3 from '@/components/stream/StreamDetailV3';

type Props = { 
  params: Promise<{ tmdbId: string }>;
  searchParams: Promise<{ type?: string }>;
};

export default async function TmdbDetailPage({ params, searchParams }: Props) {
  const { tmdbId } = await params;
  const sParams = await searchParams;
  const id = parseInt(tmdbId, 10);
  if (isNaN(id)) notFound();

  const type = sParams.type === 'tv' ? 'tv' : 'movie';
  const movie = await fetchTmdbDetail(id, type);
  if (!movie) notFound();

  const imdbId = movie.external_ids?.imdb_id ?? null;

  return (
    <StreamDetailV3 
      movie={movie} 
      imdbId={imdbId} 
      mediaType={type}
    />
  );
}
