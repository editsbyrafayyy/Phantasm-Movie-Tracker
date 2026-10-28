'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface PendingDare { tmdb_id: number; title: string; year: number | null; poster_path: string | null; votes: number }

/** Accept (adds to your Watch Later) or dismiss visitors' suggestions. */
export default function AdminDares({ dares }: { dares: PendingDare[] }) {
  const [items, setItems] = useState(dares);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(d: PendingDare, status: 'accepted' | 'dismissed') {
    setBusy(d.tmdb_id);
    setError(null);
    try {
      if (status === 'accepted') {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdb_id: d.tmdb_id,
            media_type: 'movie',
            title: d.title,
            year: d.year,
            poster_url: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
          }),
        });
        if (!res.ok && res.status !== 409) throw new Error('Could not add it to Watch Later.');
      }
      const res = await fetch('/api/admin/dares', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId: d.tmdb_id, status }),
      });
      if (!res.ok) throw new Error('Could not update the suggestion.');
      setItems(list => list.filter(x => x.tmdb_id !== d.tmdb_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  if (!items.length) return <p className="settings-desc">No open suggestions.</p>;

  return (
    <>
      {error && <p className="field-error" role="alert">{error}</p>}
      <ul className="dare-results admin-dares">
        {items.map(d => (
          <li key={d.tmdb_id} className="dare-result">
            <span className="dare-result-poster">
              {d.poster_path && <Image src={`https://image.tmdb.org/t/p/w185${d.poster_path}`} alt="" fill sizes="40px" />}
            </span>
            <span className="dare-result-title">
              {d.title}
              {d.year && <span className="dare-result-year"> {d.year}</span>}
              <span className="dare-top-votes"> · {d.votes} {d.votes === 1 ? 'request' : 'requests'}</span>
            </span>
            <span className="admin-dare-actions">
              <button type="button" className="btn-secondary dare-btn" disabled={busy === d.tmdb_id} onClick={() => resolve(d, 'accepted')}>Accept</button>
              <button type="button" className="btn-ghost dare-btn" disabled={busy === d.tmdb_id} onClick={() => resolve(d, 'dismissed')}>Dismiss</button>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
