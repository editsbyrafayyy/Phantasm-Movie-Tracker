'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, ChevronDown, ChevronUp, Film, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
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

type SortKey = 'custom' | 'recent' | 'year' | 'title' | 'type';
type MediaFilter = 'all' | 'movie' | 'tv';

const ORDER_KEY = 'vault_watchlist_order';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'custom', label: 'My order' },
  { value: 'recent', label: 'Recently added' },
  { value: 'year',   label: 'Release year' },
  { value: 'title',  label: 'Title A–Z' },
  { value: 'type',   label: 'Films, then TV' },
];

const MEDIA_FILTERS: { value: MediaFilter; label: string }[] = [
  { value: 'all',   label: 'All' },
  { value: 'movie', label: 'Films' },
  { value: 'tv',    label: 'TV' },
];

function loadSavedOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : null;
  } catch { return null; }
}

function applySavedOrder(items: WatchlistRow[], order: string[]): WatchlistRow[] {
  const orderMap = new Map(order.map((id, i) => [id, i]));
  return [...items].sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity));
}

function timeAgo(dateStr: string, now: number): string {
  const days  = Math.floor((now - new Date(dateStr).getTime()) / 86400000);
  const weeks = Math.floor(days / 7);
  if (days <= 0)  return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7)   return `${days}d ago`;
  if (weeks < 5)  return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface WatchlistClientProps {
  items: WatchlistRow[];
  loadError?: boolean;
}

export default function WatchlistClient({ items, loadError = false }: WatchlistClientProps) {
  const [listItems, setListItems] = useState<WatchlistRow[]>(items);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('custom');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [now, setNow] = useState<number | null>(null);

  // After hydration: apply the saved custom order (localStorage is client-only)
  // and capture "now" for the relative "Added …" labels. Doing this during
  // render would make the server and client HTML disagree.
  useEffect(() => {
    const saved = loadSavedOrder();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from browser-only state */
    if (saved) setListItems(prev => applySavedOrder(prev, saved));
    setNow(Date.now());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function saveOrder(updated: WatchlistRow[]) {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(updated.map(i => i.id)));
    } catch { /* storage unavailable */ }
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= listItems.length) return;
    const updated = [...listItems];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    setListItems(updated);
    saveOrder(updated);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = listItems.filter(i =>
      (!q || i.title.toLowerCase().includes(q)) &&
      (mediaFilter === 'all' || i.media_type === mediaFilter),
    );

    switch (sort) {
      case 'recent': result = [...result].sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()); break;
      case 'year':   result = [...result].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)); break;
      case 'title':  result = [...result].sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'type':   result = [...result].sort((a, b) => a.media_type.localeCompare(b.media_type)); break;
      default: break;
    }
    return result;
  }, [listItems, search, sort, mediaFilter]);

  const count = listItems.length;
  const canReorder = sort === 'custom' && !search.trim() && mediaFilter === 'all';

  const header = (
    <PageHeader
      title="Watch"
      accent="later"
      subtitle={count > 0 ? `${count} title${count === 1 ? '' : 's'} saved` : undefined}
    />
  );

  if (loadError && count === 0) {
    return (
      <>
        {header}
        <div className="empty-state" role="alert">
          <p className="empty-state-title">Could not load your list</p>
          <p className="empty-state-body">Something went wrong on our side. Reload the page to try again.</p>
        </div>
      </>
    );
  }

  if (count === 0) {
    return (
      <>
        {header}
        <div className="empty-state">
          <Bookmark size={40} aria-hidden="true" />
          <p className="empty-state-title">Nothing saved yet</p>
          <p className="empty-state-body">
            Hit the bookmark on any film or show to save it here for later.
          </p>
          <Link href="/browse" className="btn-primary">Browse films</Link>
        </div>
      </>
    );
  }

  return (
    <>
      {header}

      <div className="list-toolbar">
        <div className="list-toolbar-search">
          <label htmlFor="watchlist-search" className="sr-only">Search saved titles</label>
          <Search size={16} className="list-toolbar-search-icon" aria-hidden="true" />
          <input
            id="watchlist-search"
            type="search"
            className="field-input"
            placeholder="Search saved titles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="list-toolbar-chips" role="group" aria-label="Filter by type">
          {MEDIA_FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              className="chip"
              aria-pressed={mediaFilter === f.value}
              onClick={() => setMediaFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="list-toolbar-sort">
          <label htmlFor="watchlist-sort" className="sr-only">Sort</label>
          <select
            id="watchlist-sort"
            className="field-input field-select"
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No matches</p>
          <p className="empty-state-body">Nothing in your list matches that search or filter.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setSearch(''); setMediaFilter('all'); }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="watchlist-grid">
          {filtered.map(item => {
            const index = listItems.findIndex(i => i.id === item.id);
            const href = `/stream/tmdb/${item.tmdb_id}?type=${item.media_type}&from=/watchlist`;
            return (
              <li key={item.id} className="watchlist-card">
                <Link href={href} className="watchlist-card-poster-link" aria-label={item.title}>
                  <div className="watchlist-card-poster">
                    {item.poster_url ? (
                      <Image
                        src={item.poster_url}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 45vw, 160px"
                        className="watchlist-card-img"
                      />
                    ) : (
                      <div className="watchlist-card-fallback"><Film size={32} aria-hidden="true" /></div>
                    )}
                    <span className="watchlist-card-type">{item.media_type === 'tv' ? 'TV' : 'Film'}</span>
                  </div>
                </Link>

                <div className="watchlist-card-body">
                  <div className="watchlist-card-info">
                    <Link href={href} className="watchlist-card-title" tabIndex={-1}>
                      {item.title}
                    </Link>
                    <div className="watchlist-card-meta">
                      {item.year && <span>{item.year}</span>}
                      {now !== null && <span>Added {timeAgo(item.added_at, now)}</span>}
                    </div>
                  </div>

                  <div className="watchlist-card-actions">
                    {canReorder && (
                      <>
                        <button
                          type="button"
                          className="icon-btn watchlist-move-btn"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index <= 0}
                          aria-label={`Move ${item.title} up`}
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn watchlist-move-btn"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === listItems.length - 1}
                          aria-label={`Move ${item.title} down`}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </>
                    )}
                    <WatchlistRemoveButton
                      tmdbId={item.tmdb_id}
                      mediaType={item.media_type}
                      title={item.title}
                      onRemove={() => setListItems(prev => prev.filter(i => i.id !== item.id))}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
