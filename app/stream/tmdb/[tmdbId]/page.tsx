import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchTmdbDetail } from '@/lib/tmdb';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import StreamDetailV3 from '@/components/stream/StreamDetailV3';

type Props = {
  params: Promise<{ tmdbId: string }>;
  searchParams: Promise<{ type?: string }>;
};

/** Release date (YYYY-MM-DD) when it is still in the future, else null. */
function upcomingDate(date?: string): string | null {
  if (!date) return null;
  const t = new Date(`${date}T00:00:00Z`).getTime();
  return Number.isFinite(t) && t > Date.now() ? date : null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { tmdbId } = await params;
  const { type } = await searchParams;
  const id = parseInt(tmdbId, 10);
  if (isNaN(id)) return { title: 'Title — Phantasm' };
  const movie = await fetchTmdbDetail(id, type === 'tv' ? 'tv' : 'movie');
  return { title: `${movie?.title ?? movie?.name ?? 'Title'} — Phantasm` };
}

/** Public TMDB info page. Playing requires an account (the player route checks it again). */
export default async function TmdbDetailPage({ params, searchParams }: Props) {
  const { tmdbId } = await params;
  const sParams = await searchParams;
  const id = parseInt(tmdbId, 10);
  if (isNaN(id)) notFound();

  const type = sParams.type === 'tv' ? 'tv' : 'movie';
  const [movie, { data: { user } }] = await Promise.all([
    fetchTmdbDetail(id, type),
    createServerSupabaseClient().then(c => c.auth.getUser()),
  ]);
  if (!movie || !movie.id) notFound();

  const imdbId = movie.external_ids?.imdb_id ?? null;
  const releaseDate = upcomingDate(movie.release_date || movie.first_air_date);

  return (
    <StreamDetailV3
      movie={movie}
      imdbId={imdbId}
      mediaType={type}
      upcomingRelease={releaseDate}
      today={new Date().toISOString().slice(0, 10)}
      canStream={!!user}
    />
  );
}
