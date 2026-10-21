'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Trash2, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { createClient } from '@/lib/supabase/client';

// History is created by the player (VideoPlayerClient) and enriched with progress by
// WatchProgressTracker. This row reads it, and only ever removes entries or adds
// fields (`completed`) — the stored shape stays backward-compatible.
export interface HistoryEntry {
  id: string;           // tmdbId || imdbId
  title: string;
  poster_url: string | null;
  type: string;         // 'movie' | 'tv'
  watchedAt: number;
  progress?: number;    // 0-100 (older entries may hold a 0-1 ratio)
  currentTime?: number; // seconds
  duration?: number;    // seconds
  completed?: boolean;
  season?: number;      // tv: last episode played
  episode?: number;
}

const HISTORY_KEY = 'vault_watch_history';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COMPLETE_AT = 90;

// ── localStorage as an external store ──────────────────────────────────────
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === HISTORY_KEY) cb(); };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage); };
}
function readRaw(): string | null {
  try { return localStorage.getItem(HISTORY_KEY); } catch { return null; }
}
const readServer = () => null;

function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const all = JSON.parse(raw);
    return Array.isArray(all) ? all.filter(e => e && typeof e.id === 'string') : [];
  } catch { return []; }
}

function writeHistory(next: HistoryEntry[]) {
  try {
    if (next.length) localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    else localStorage.removeItem(HISTORY_KEY);
  } catch { /* ignore */ }
  listeners.forEach(l => l());
}

function updateEntry(id: string, change: (e: HistoryEntry) => HistoryEntry | null) {
  const all = parseHistory(readRaw());
  const next = all.flatMap(e => {
    if (e.id !== id) return [e];
    const changed = change(e);
    return changed ? [changed] : [];
  });
  writeHistory(next);
}

/** Percent watched (0-100) when the player reported it, else null. */
function progressPct(e: HistoryEntry): number | null {
  if (e.currentTime && e.duration && e.duration > 0) {
    return Math.min(100, Math.round((e.currentTime / e.duration) * 100));
  }
  if (typeof e.progress === 'number' && e.progress > 0) {
    return Math.min(100, Math.round(e.progress > 0 && e.progress < 1 ? e.progress * 100 : e.progress));
  }
  return null;
}

function isCompleted(e: HistoryEntry): boolean {
  if (e.completed) return true;
  if (e.type === 'tv') {
    // Progress on a show is per episode, so only the episode checklist can finish it.
    try {
      const stored = localStorage.getItem(`watched:${e.id}`);
      if (stored) {
        const eps: Record<string, boolean> = JSON.parse(stored);
        const keys = Object.keys(eps);
        if (keys.length > 0 && keys.filter(k => eps[k]).length / keys.length >= 0.85) return true;
      }
    } catch { /* ignore */ }
    return false;
  }
  const pct = progressPct(e);
  return pct !== null && pct >= COMPLETE_AT;
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
function startedLabel(watchedAt: number, now: number): string {
  const days = Math.floor((now - watchedAt) / 86_400_000);
  if (days < 1) return 'Started today';
  if (days < 7) return `Started ${relative.format(-days, 'day')}`;
  return `Started ${relative.format(-Math.floor(days / 7), 'week')}`;
}

function remainingLabel(e: HistoryEntry, pct: number): string {
  if (e.currentTime && e.duration) {
    const mins = Math.max(1, Math.round((e.duration - e.currentTime) / 60));
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m left` : `${mins} min left`;
  }
  return `${pct}% watched`;
}

function playerHref(e: HistoryEntry): string {
  if (e.type !== 'tv') return `/stream/${e.id}`;
  const params = new URLSearchParams({ type: 'tv' });
  if (e.season) params.set('s', String(e.season));
  if (e.episode) params.set('e', String(e.episode));
  return `/stream/${e.id}?${params}`;
}

/** IMDb + TMDB ids of everything the signed-in user has rated. */
function useRatedIds(userId: string | null): Set<string> | null {
  const [state, setState] = useState<{ userId: string; ids: Set<string> } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    createClient()
      .from('entries')
      .select('movie:movies(omdb_id, tmdb_id)')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (cancelled) return;
        const ids = new Set<string>();
        for (const row of (data ?? []) as { movie: { omdb_id: string | null; tmdb_id: number | null } | { omdb_id: string | null; tmdb_id: number | null }[] | null }[]) {
          const movies = Array.isArray(row.movie) ? row.movie : row.movie ? [row.movie] : [];
          for (const m of movies) {
            if (m.omdb_id) ids.add(m.omdb_id);
            if (m.tmdb_id) ids.add(String(m.tmdb_id));
          }
        }
        setState({ userId, ids });
      });
    return () => { cancelled = true; };
  }, [userId]);

  return state && state.userId === userId ? state.ids : null;
}

export default function WatchHistoryRow() {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const raw = useSyncExternalStore(subscribe, readRaw, readServer);
  // Snapshot "now" once per mount (labels are day-granular).
  const [now] = useState(() => Date.now());
  const ratedIds = useRatedIds(userId);

  const items = useMemo(() => {
    // Wait for the vault lookup so rated titles don't flash in and out.
    if (!ratedIds) return [];
    return parseHistory(raw)
      .filter(e => now - e.watchedAt < TTL_MS && !isCompleted(e) && !ratedIds.has(e.id))
      .sort((a, b) => b.watchedAt - a.watchedAt);
  }, [raw, now, ratedIds]);

  const scrollRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Drop expired (>30d) entries from storage so they don't linger.
  useEffect(() => {
    const all = parseHistory(raw);
    const fresh = all.filter(e => now - e.watchedAt < TTL_MS);
    if (fresh.length !== all.length) {
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
    }
  }, [raw, now]);

  // Track scroll affordances (subscribe to scroll/resize; state set only in callbacks).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener('scroll', update); };
  }, [items.length]);

  const clearHistory = () => writeHistory([]);
  const removeItem = (id: string) => updateEntry(id, () => null);
  const markWatched = (id: string) => updateEntry(id, e => ({ ...e, completed: true, progress: 100 }));

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -distance : distance, behavior: 'smooth' });
  };

  // Guests have no history worth resuming (the player is members-only).
  if (loading || !userId || items.length === 0) return null;

  return (
    <section className="watch-history-section" aria-labelledby="watch-history-heading">
      <div className="watch-history-header">
        <div className="watch-history-heading-group">
          <h2 id="watch-history-heading" className="watch-history-label">Continue watching</h2>
          <span className="watch-history-count">{items.length}</span>
        </div>
        <div className="watch-history-controls">
          {items.length > 3 && (
            <>
              <button
                type="button"
                className="icon-btn"
                onClick={() => scrollByAmount('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => scrollByAmount('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          <button type="button" className="btn-ghost watch-history-clear" onClick={clearHistory} aria-label="Clear watch history">
            <Trash2 size={14} aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>

      <ul className="watch-history-row" ref={scrollRef}>
        {items.map(item => {
          const pct = progressPct(item);
          const episode = item.type === 'tv' && item.season && item.episode
            ? `S${item.season} E${item.episode}`
            : null;
          const meta = pct !== null ? remainingLabel(item, pct) : startedLabel(item.watchedAt, now);
          return (
            <li key={item.id} className="watch-history-item">
              <Link
                href={playerHref(item)}
                className="watch-history-card"
                prefetch={false}
                aria-label={`Resume ${item.title}${episode ? `, ${episode}` : ''}${pct !== null ? `, ${pct}% watched` : ''}`}
              >
                <div className="watch-history-poster">
                  {item.poster_url ? (
                    <Image src={item.poster_url} alt="" fill className="browse-card-img" sizes="120px" />
                  ) : (
                    <div className="watch-history-poster-fallback" aria-hidden="true">
                      {item.title.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="watch-history-play-overlay" aria-hidden="true">
                    <span className="watch-history-play-icon"><Play size={20} fill="currentColor" /></span>
                  </div>

                  {pct !== null && (
                    <div className="watch-history-progress-track" aria-hidden="true">
                      <div className="watch-history-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                <p className="watch-history-title" title={item.title}>{item.title}</p>
                <p className="watch-history-meta">
                  {episode && <span>{episode} · </span>}
                  {meta}
                </p>
              </Link>

              <div className="watch-history-actions">
                <button
                  type="button"
                  className="watch-history-action"
                  onClick={() => markWatched(item.id)}
                  aria-label={`Mark ${item.title} as watched`}
                  title="Mark as watched"
                >
                  <Check size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="watch-history-action"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.title} from continue watching`}
                  title="Remove"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
