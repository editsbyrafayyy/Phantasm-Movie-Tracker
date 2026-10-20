import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import WatchlistClient, { type WatchlistRow } from '@/components/watchlist/WatchlistClient';

export const metadata: Metadata = {
  title: 'Watch Later — Phantasm',
  description: 'Your personal horror watchlist.',
};

export default async function WatchlistPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('watchlist')
    .select('id, tmdb_id, media_type, title, poster_url, year, added_at')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Watchlist page fetch error:', error);
  }

  const items = (error ? [] : (data ?? [])) as WatchlistRow[];

  return (
    <div className="page-container watchlist-page">
      <WatchlistClient items={items} loadError={!!error} />
    </div>
  );
}
