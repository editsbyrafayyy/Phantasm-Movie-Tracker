'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';

interface WatchlistButtonProps {
  tmdbId:    number;
  mediaType: 'movie' | 'tv';
  title:     string;
  posterUrl: string | null;
  year:      number | null;
  /** If false, renders as a compact icon-only button */
  showLabel?: boolean;
  className?: string;
}

// ── Shared session cache ──────────────────────────────────────────────────────
// One GET /api/watchlist per signed-in user, shared by every button on the page.

interface CacheState {
  userId:   string | null;
  ids:      Set<string>;
  loaded:   boolean;
  inFlight: Promise<void> | null;
  version:  number;
}

const cache: CacheState = { userId: null, ids: new Set(), loaded: false, inFlight: null, version: 0 };
const listeners = new Set<() => void>();
let inFlightToken: object | null = null;

function emit() {
  cache.version++;
  listeners.forEach(l => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
const getVersion = () => cache.version;

/**
 * Drop the cached watchlist so the next button mount re-fetches it.
 * Call after changing the watchlist outside this component (e.g. WatchlistRemoveButton).
 */
export function invalidateWatchlistCache(): void {
  cache.ids = new Set();
  cache.loaded = false;
  cache.inFlight = null;
  inFlightToken = null;
  emit();
}

function ensureLoaded(userId: string): Promise<void> {
  if (cache.userId !== userId) {
    // Different account (or first load) — start fresh.
    cache.userId = userId;
    cache.ids = new Set();
    cache.loaded = false;
    cache.inFlight = null;
    inFlightToken = null;
  }
  if (cache.loaded) return Promise.resolve();
  if (cache.inFlight) return cache.inFlight;

  const token = {};
  inFlightToken = token;
  const p = (async () => {
    try {
      const res = await fetch('/api/watchlist');
      if (!res.ok) return;
      const items = (await res.json()) as { tmdb_id: number; media_type: string }[];
      if (cache.userId !== userId || inFlightToken !== token) return; // stale
      cache.ids = new Set(items.map(i => `${i.tmdb_id}:${i.media_type}`));
      cache.loaded = true;
    } catch {
      /* network error — leave unloaded so a later mount can retry */
    } finally {
      if (inFlightToken === token) {
        inFlightToken = null;
        cache.inFlight = null;
      }
      emit();
    }
  })();
  cache.inFlight = p;
  return p;
}

export default function WatchlistButton({
  tmdbId,
  mediaType,
  title,
  posterUrl,
  year,
  showLabel = true,
  className = '',
}: WatchlistButtonProps) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const key = `${tmdbId}:${mediaType}`;
  const [busy, setBusy] = useState(false);

  // Re-render whenever the shared cache changes.
  useSyncExternalStore(subscribe, getVersion, getVersion);

  useEffect(() => {
    if (userId) void ensureLoaded(userId);
  }, [userId]);

  const ready = !!userId && cache.userId === userId && cache.loaded;
  const saved = ready && cache.ids.has(key);

  const toggle = useCallback(async () => {
    if (busy || !ready) return;
    setBusy(true);
    const next = !saved;
    try {
      const res = next
        ? await fetch('/api/watchlist', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType, title, poster_url: posterUrl, year }),
          })
        : await fetch(`/api/watchlist?tmdb_id=${tmdbId}&media_type=${mediaType}`, { method: 'DELETE' });
      if (res.ok) {
        if (next) cache.ids.add(key);
        else cache.ids.delete(key);
        emit();
      }
    } catch {
      /* network error — state unchanged */
    } finally {
      setBusy(false);
    }
  }, [busy, ready, saved, tmdbId, mediaType, title, posterUrl, year, key]);

  // Guests have no watchlist; hide until the saved state is known to avoid a flash.
  if (!ready) return null;

  const label = saved ? 'Remove from Watch Later' : 'Save to Watch Later';

  return (
    <button
      type="button"
      className={`watchlist-btn${saved ? ' saved' : ''}${showLabel ? ' has-label' : ''}${className ? ` ${className}` : ''}`}
      onClick={e => { e.preventDefault(); e.stopPropagation(); void toggle(); }}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      disabled={busy}
    >
      {saved
        ? <BookmarkCheck size={16} className="watchlist-icon" aria-hidden="true" />
        : <Bookmark size={16} className="watchlist-icon" aria-hidden="true" />}
      {showLabel && <span>{saved ? 'Saved' : 'Watch Later'}</span>}
    </button>
  );
}
