import { redirect, notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ tmdbId: string }> };

export default async function TmdbRedirectPage({ params }: Props) {
  const { tmdbId } = await params;

  // Auth check — streaming is members only
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login?next=/stream/tmdb/' + tmdbId);

  const key = process.env.TMDB_API_KEY;
  if (!key) notFound();

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${key}`,
    { cache: 'no-store' }
  );
  if (!res.ok) notFound();

  const data = await res.json();
  const imdbId = data.imdb_id as string | null;

  if (!imdbId) notFound();
  redirect(`/stream/${imdbId}`);
}
