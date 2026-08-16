import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Bookmark } from 'lucide-react';
import WatchlistClient from '@/components/watchlist/WatchlistClient';

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
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  const items = error ? [] : (data ?? []);

  return (
    <div className="watchlist-page">
      {/* Header */}
      <header className="watchlist-header">
        <div className="watchlist-header-inner">
          <div className="watchlist-header-left">
            <span className="watchlist-eyebrow">Your Queue</span>
            <h1 className="watchlist-title">Watch Later</h1>
            <p className="watchlist-sub">
              {items.length > 0
                ? `${items.length} film${items.length === 1 ? '' : 's'} saved to your queue`
                : 'Your watchlist is empty'}
            </p>
          </div>
          <span className="watchlist-header-icon" aria-hidden="true">
            <Bookmark size={32} strokeWidth={1.5} />
          </span>
        </div>
      </header>

      <WatchlistClient items={items} />
    </div>
  );
}
