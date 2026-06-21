'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

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

// Simple in-memory cache for the current session so we don't refetch on every render
const savedIds = new Set<string>();
let cacheLoaded = false;

async function loadCache(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const res = await fetch('/api/watchlist');
    if (!res.ok) return;
    const items = await res.json() as { tmdb_id: number; media_type: string }[];
    items.forEach(i => savedIds.add(`${i.tmdb_id}:${i.media_type}`));
    cacheLoaded = true;
  } catch { /* silently fail — user is logged out */ }
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
  const key          = `${tmdbId}:${mediaType}`;
  const [saved,    setSaved]    = useState(savedIds.has(key));
  const [loading,  setLoading]  = useState(false);
  const [ready,    setReady]    = useState(cacheLoaded);

  // Load cache once on mount
  useEffect(() => {
    if (cacheLoaded) {
      setSaved(savedIds.has(key));
      setReady(true);
      return;
    }
    loadCache().then(() => {
      setSaved(savedIds.has(key));
      setReady(true);
    });
  }, [key]);

  const toggle = useCallback(async () => {
    if (loading || !ready) return;
    setLoading(true);
    const next = !saved;

    try {
      if (next) {
        const res = await fetch('/api/watchlist', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType, title, poster_url: posterUrl, year }),
        });
        if (res.ok) {
          savedIds.add(key);
          setSaved(true);
        } else if (res.status === 401) {
          // Not logged in — silently ignore (button shouldn't be shown anyway)
        }
      } else {
        const res = await fetch(`/api/watchlist?tmdb_id=${tmdbId}&media_type=${mediaType}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          savedIds.delete(key);
          setSaved(false);
        }
      }
    } catch { /* network error — silently fail */ }
    finally { setLoading(false); }
  }, [loading, ready, saved, tmdbId, mediaType, title, posterUrl, year, key]);

  if (!ready) return null; // Don't flash un-saved state before cache loaded

  return (
    <button
      className={`watchlist-btn${saved ? ' saved' : ''}${showLabel ? ' has-label' : ''}${className ? ` ${className}` : ''}`}
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      aria-label={saved ? 'Remove from watchlist' : 'Add to watchlist'}
      title={saved ? 'Remove from Watch Later' : 'Save to Watch Later'}
      disabled={loading}
    >
      {saved ? (
        <BookmarkCheck size={showLabel ? 14 : 16} className="watchlist-icon" />
      ) : (
        <Bookmark size={showLabel ? 14 : 16} className="watchlist-icon" />
      )}
      {showLabel && <span>{saved ? 'Saved' : 'Watch Later'}</span>}
    </button>
  );
}
