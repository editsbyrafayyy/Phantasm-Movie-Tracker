'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Film } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';

interface OnThisDayMatch {
  id: string;
  yearsAgo: number;
  movie: {
    id: string;
    title: string;
    poster_url: string | null;
    year: number | null;
  };
}

/** "On this day N years ago you watched…" banner, from the signed-in member's diary. */
export default function OnThisDayWidget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [match, setMatch] = useState<{ userId: string; data: OnThisDayMatch } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return; // diary is members-only — guests would just get a 401
    const ctrl = new AbortController();
    fetch('/api/diary?onThisDay=true', { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const entry = data?.diary?.[0];
        if (!entry?.watched_at || !entry.movie) return;
        const yearsAgo = new Date().getFullYear() - new Date(entry.watched_at).getFullYear();
        if (yearsAgo < 1) return;
        setMatch({ userId, data: { id: entry.id, yearsAgo, movie: entry.movie } });
      })
      .catch(() => { /* aborted or offline */ });
    return () => ctrl.abort();
  }, [userId]);

  // Ignore a match that belongs to a previous session (e.g. after sign-out).
  if (!match || match.userId !== userId || dismissed) return null;
  const { yearsAgo, movie } = match.data;

  return (
    <aside className="otd-banner" aria-label="On this day">
      <div className="otd-banner-poster">
        {movie.poster_url ? (
          <Image src={movie.poster_url} alt="" fill sizes="44px" className="otd-banner-poster-img" />
        ) : (
          <Film size={16} aria-hidden="true" />
        )}
      </div>

      <div className="otd-banner-text">
        <p className="otd-banner-eyebrow">
          On this day · {yearsAgo} year{yearsAgo > 1 ? 's' : ''} ago
        </p>
        <p className="otd-banner-body">
          You watched <Link href="/diary" className="otd-banner-link">{movie.title}</Link>
          {movie.year ? ` (${movie.year})` : ''}
        </p>
      </div>

      <button type="button" className="icon-btn" onClick={() => setDismissed(true)} aria-label="Dismiss">
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}
