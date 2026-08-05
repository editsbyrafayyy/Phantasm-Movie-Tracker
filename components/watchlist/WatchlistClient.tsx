'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Film, Search, ChevronUp, ChevronDown } from 'lucide-react';
import WatchlistRemoveButton from '@/components/watchlist/WatchlistRemoveButton';

export interface WatchlistRow {
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

type SortKey = 'custom' | 'recent' | 'year' | 'title' | 'type';

export default function WatchlistClient({ items }: { items: WatchlistRow[] }) {
  const [listItems, setListItems] = useState(items);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('custom');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');

  function moveItem(index: number, direction: 'up' | 'down') {
    // Find the real index in listItems when working with filtered view
    // We operate on the full listItems array
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= listItems.length) return;
    const updated = [...listItems];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    setListItems(updated);
  }

  const filtered = useMemo(() => {
    let result = [...listItems];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q));
    }

    if (mediaFilter !== 'all') {
      result = result.filter(i => i.media_type === mediaFilter);
    }

    switch (sort) {
      case 'recent':
        result = [...result].sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
        break;
      case 'year':
        result = [...result].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      case 'title':
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'type':
        result = [...result].sort((a, b) => a.media_type.localeCompare(b.media_type));
        break;
      case 'custom':
      default:
        break;
    }

    return result;
  }, [listItems, search, sort, mediaFilter]);

  const isCustomSortActive = sort === 'custom';

  if (items.length === 0) {
    return (
      <div className="watchlist-empty">
        <div className="watchlist-empty-icon"><Film size={40} strokeWidth={1} /></div>
        <h2 className="watchlist-empty-title">Nothing saved yet</h2>
        <p className="watchlist-empty-sub">
          Browse horror films and hit the <strong>Watch Later</strong> button to save them here.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/browse" className="btn-primary" style={{ display: 'inline-flex', width: 'fit-content' }}>
            Browse Films →
          </Link>
          <Link href="/vault" className="btn-edit" style={{ display: 'inline-flex', width: 'fit-content' }}>
            View Vault
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search saved titles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
          />
        </div>

        {/* Media type filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'movie', 'tv'] as const).map(f => (
            <button
              key={f}
              className={`btn-edit${mediaFilter === f ? ' active' : ''}`}
              onClick={() => setMediaFilter(f)}
              style={{ height: 38, fontSize: 12 }}
            >
              {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV'}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <select
          className="form-input"
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          style={{ height: 38, fontSize: 12, width: 'auto' }}
        >
          <option value="custom">My Order</option>
          <option value="recent">Recently Added</option>
          <option value="year">Release Year</option>
          <option value="title">Title A–Z</option>
          <option value="type">Type (Movies/TV)</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          No saved items match your filter.
        </div>
      ) : (
        <div className="watchlist-grid">
          {filtered.map((item, index) => {
            // Get original index in full listItems for reordering
            const originalIndex = listItems.findIndex(i => i.id === item.id);
            return (
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

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Reorder controls — only visible in custom sort mode */}
                  {isCustomSortActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        onClick={() => moveItem(originalIndex, 'up')}
                        disabled={originalIndex === 0}
                        title="Move up"
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: 4,
                          color: originalIndex === 0 ? 'var(--text-dim)' : 'var(--text-muted)',
                          cursor: originalIndex === 0 ? 'not-allowed' : 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          opacity: originalIndex === 0 ? 0.3 : 1,
                        }}
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => moveItem(originalIndex, 'down')}
                        disabled={originalIndex === listItems.length - 1}
                        title="Move down"
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: 4,
                          color: originalIndex === listItems.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)',
                          cursor: originalIndex === listItems.length - 1 ? 'not-allowed' : 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          opacity: originalIndex === listItems.length - 1 ? 0.3 : 1,
                        }}
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  )}
                  <WatchlistRemoveButton tmdbId={item.tmdb_id} mediaType={item.media_type} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
