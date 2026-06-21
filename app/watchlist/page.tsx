import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link  from 'next/link';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Bookmark, Film } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Watch Later — Vault',
  description: 'Your personal horror watchlist.',
};

interface WatchlistRow {
  id:         string;
  tmdb_id:    number;
  media_type: string;
  title:      string;
  poster_url: string | null;
  year:       number | null;
  added_at:   string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function WatchlistPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  const items: WatchlistRow[] = error ? [] : (data ?? []);

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

      {items.length === 0 ? (
        <div className="watchlist-empty">
          <div className="watchlist-empty-icon"><Film size={40} strokeWidth={1} /></div>
          <h2 className="watchlist-empty-title">Nothing saved yet</h2>
          <p className="watchlist-empty-sub">
            Browse horror films and hit the <strong>Watch Later</strong> button to save them here.
          </p>
          <Link href="/browse" className="btn-primary" style={{ display: 'inline-flex', width: 'fit-content' }}>
            Browse Films →
          </Link>
        </div>
      ) : (
        <div className="watchlist-grid">
          {items.map(item => (
            <div key={item.id} className="watchlist-card">
              <Link
                href={`/stream/tmdb/${item.tmdb_id}?type=${item.media_type}&from=/watchlist`}
                className="watchlist-card-poster-link"
              >
                <div className="watchlist-card-poster">
                  {item.poster_url ? (
                    <Image
                      src={item.poster_url}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 40vw, 160px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="watchlist-card-fallback"><Film size={24} opacity={0.3} /></div>
                  )}
                  <div className="watchlist-card-overlay" />
                  <span className="watchlist-card-type">
                    {item.media_type === 'tv' ? 'TV' : 'Film'}
                  </span>
                </div>
              </Link>

              <div className="watchlist-card-info">
                <Link
                  href={`/stream/tmdb/${item.tmdb_id}?type=${item.media_type}&from=/watchlist`}
                  className="watchlist-card-title"
                >
                  {item.title}
                </Link>
                <div className="watchlist-card-meta">
                  {item.year && <span>{item.year}</span>}
                  <span className="watchlist-card-added">Added {timeAgo(item.added_at)}</span>
                </div>
              </div>

              {/* Remove button — uses a tiny form for server-friendly removal */}
              <WatchlistRemoveButton tmdbId={item.tmdb_id} mediaType={item.media_type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline client component for remove so the page itself stays a server component
import WatchlistRemoveButton from '@/components/watchlist/WatchlistRemoveButton';
