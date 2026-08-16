'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, X, Film } from 'lucide-react';

interface OnThisDayMatch {
  id: string;
  movie_id: string;
  watched_at: string;
  yearsAgo: number;
  movie: {
    id: string;
    title: string;
    poster_url: string | null;
    year: number | null;
  };
}

export default function OnThisDayWidget() {
  const [match, setMatch] = useState<OnThisDayMatch | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Use targeted server-side filter — returns at most 1 matching entry
    fetch('/api/diary?onThisDay=true')
      .then(r => r.json())
      .then(data => {
        const entries = data.diary ?? [];
        if (!entries.length) return;
        const entry = entries[0];
        if (!entry.watched_at || !entry.movie) return;
        const entryYear = new Date(entry.watched_at).getFullYear();
        const currentYear = new Date().getFullYear();
        setMatch({
          id: entry.id,
          movie_id: entry.movie_id,
          watched_at: entry.watched_at,
          yearsAgo: currentYear - entryYear,
          movie: entry.movie,
        });
      })
      .catch(() => {});
  }, []);

  if (!match || dismissed) return null;

  const poster = match.movie.poster_url;

  return (
    <div
      className="on-this-day-widget"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flexShrink: 0, position: 'relative', width: 44, height: 62, borderRadius: 6, overflow: 'hidden', background: '#111' }}>
          {poster ? (
            <Image src={poster} alt={match.movie.title} fill sizes="44px" style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Film size={20} color="rgba(255,255,255,0.3)" />
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--red)' }}>
            <Calendar size={12} />
            <span>On This Day ({match.yearsAgo} Year{match.yearsAgo > 1 ? 's' : ''} Ago)</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: '#fff' }}>
            You watched <Link href={`/vault/${match.movie_id}`} style={{ color: 'var(--red)', textDecoration: 'underline' }}>{match.movie.title}</Link> {match.movie.year ? `(${match.movie.year})` : ''}
          </p>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
        title="Dismiss banner"
      >
        <X size={16} />
      </button>
    </div>
  );
}
