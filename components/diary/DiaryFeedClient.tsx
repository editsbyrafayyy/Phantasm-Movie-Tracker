'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Film, Search, Trash2 } from 'lucide-react';
import Toast, { type ToastType } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatRelativeDate, formatFullDate } from '@/lib/dateUtils';

export interface DiaryItem {
  id: string;
  movie_id?: string | null;
  watched_at: string;
  rewatch: boolean;
  quick_note?: string | null;
  movie?: {
    id: string;
    title: string;
    poster_url?: string | null;
    year?: number | null;
  } | null;
}

interface DiaryFeedClientProps {
  initialDiary: DiaryItem[];
  loadError?: boolean;
}

type Filter = 'all' | 'first' | 'rewatch';

// Relative dates depend on "today", which differs between server and client
// (and across midnight). Render the absolute date on the server / first paint,
// then switch to relative once hydrated.
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function DiaryFeedClient({ initialDiary, loadError = false }: DiaryFeedClientProps) {
  const hydrated = useHydrated();
  const [diary, setDiary] = useState<DiaryItem[]>(initialDiary);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const q = search.trim().toLowerCase();
  const filtered = diary.filter(item => {
    if (filter === 'first' && item.rewatch) return false;
    if (filter === 'rewatch' && !item.rewatch) return false;
    if (!q) return true;
    const title = item.movie?.title?.toLowerCase() ?? '';
    const note = item.quick_note?.toLowerCase() ?? '';
    return title.includes(q) || note.includes(q);
  });

  const rewatchCount = diary.filter(d => d.rewatch).length;
  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all',     label: 'All',            count: diary.length },
    { key: 'first',   label: 'First watches',  count: diary.length - rewatchCount },
    { key: 'rewatch', label: 'Rewatches',      count: rewatchCount },
  ];

  async function handleDelete() {
    const id = deletingId;
    if (!id) return;
    try {
      const res = await fetch(`/api/diary?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setDiary(prev => prev.filter(d => d.id !== id));
      setToast({ message: 'Watch log removed', type: 'success' });
    } catch {
      setToast({ message: 'Could not remove that log', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  }

  if (loadError && diary.length === 0) {
    return (
      <div className="empty-state" role="alert">
        <p className="empty-state-title">Could not load your diary</p>
        <p className="empty-state-body">Something went wrong on our side. Reload the page to try again.</p>
      </div>
    );
  }

  if (diary.length === 0) {
    return (
      <div className="empty-state">
        <BookOpen size={40} aria-hidden="true" />
        <p className="empty-state-title">Your diary is empty</p>
        <p className="empty-state-body">
          Log a viewing or rewatch from any film page in your vault and it will show up here.
        </p>
        <Link href="/vault" className="btn-primary">Open your vault</Link>
      </div>
    );
  }

  return (
    <div className="diary-feed-wrapper">
      <div className="list-toolbar">
        <div className="list-toolbar-search">
          <label htmlFor="diary-search" className="sr-only">Search diary</label>
          <Search size={16} className="list-toolbar-search-icon" aria-hidden="true" />
          <input
            id="diary-search"
            type="search"
            className="field-input"
            placeholder="Search titles and notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="list-toolbar-chips" role="group" aria-label="Filter diary">
          {filters.map(f => (
            <button
              key={f.key}
              type="button"
              className="chip"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label} <span className="chip-count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No matches</p>
          <p className="empty-state-body">Nothing in your diary matches that search or filter.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setSearch(''); setFilter('all'); }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="diary-feed-list">
          {filtered.map(item => {
            const movieId = item.movie?.id ?? item.movie_id ?? null;
            const title = item.movie?.title ?? 'Unknown film';
            const fullDate = formatFullDate(item.watched_at);
            const dateLabel = hydrated ? formatRelativeDate(item.watched_at) : fullDate;

            return (
              <li key={item.id} className="diary-item-card">
                <time className="diary-item-date" dateTime={item.watched_at} title={fullDate}>
                  {dateLabel}
                </time>

                <div className="diary-item-poster">
                  {item.movie?.poster_url ? (
                    <Image src={item.movie.poster_url} alt="" fill sizes="44px" className="diary-item-poster-img" />
                  ) : (
                    <Film size={16} aria-hidden="true" />
                  )}
                </div>

                <div className="diary-item-info">
                  <div className="diary-item-title-row">
                    {movieId ? (
                      <Link href={`/vault/${movieId}`} className="diary-item-title">{title}</Link>
                    ) : (
                      <span className="diary-item-title">{title}</span>
                    )}
                    {item.movie?.year && <span className="diary-item-year">{item.movie.year}</span>}
                    {item.rewatch && <span className="diary-rewatch-badge">Rewatch</span>}
                  </div>
                  {item.quick_note && (
                    <p className="diary-item-note">&ldquo;{item.quick_note}&rdquo;</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDeletingId(item.id)}
                  className="icon-btn diary-item-delete"
                  aria-label={`Remove ${title} watch log`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {deletingId && (
        <ConfirmDialog
          title="Remove watch log?"
          body="This viewing will be removed from your diary."
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
