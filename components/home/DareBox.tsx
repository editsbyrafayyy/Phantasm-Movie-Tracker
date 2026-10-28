'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Search } from 'lucide-react';

export interface TopDare { tmdb_id: number; title: string; year: number | null; votes: number }
interface Result { id: number; title: string; year: number | null; poster: string | null; rated: boolean }

/**
 * Search + dare. Visitors can only pick a film from the screened search results —
 * there is no free-text field. The hidden `website` input is a bot honeypot.
 */
export default function DareBox({ owner, top }: { owner: string; top: TopDare[] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ q: string; items: Result[] } | null>(null);
  const [sent, setSent] = useState<Record<number, 'sending' | 'sent'>>({});
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const tokenRef = useRef<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // A signed timestamp from the server, fetched once the visitor starts typing.
  const ensureToken = () => {
    if (tokenRef.current) return;
    tokenRef.current = 'pending';
    fetch('/api/dares/token', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((d: { token?: string } | null) => { tokenRef.current = d?.token ?? null; })
      .catch(() => { tokenRef.current = null; });
  };

  const q = query.trim();
  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/dares/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then(r => (r.ok ? r.json() : []))
        .then((items: Result[]) => setResults({ q, items: Array.isArray(items) ? items : [] }))
        .catch(() => { /* aborted */ });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q]);

  const shown = q.length >= 2 && results?.q === q ? results.items : null;

  async function dare(film: Result) {
    setSent(s => ({ ...s, [film.id]: 'sending' }));
    setMessage(null);
    try {
      const res = await fetch('/api/dares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId: film.id, token: tokenRef.current, website: honeypotRef.current?.value ?? '' }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not send that dare.');
      setSent(s => ({ ...s, [film.id]: 'sent' }));
      setMessage({ text: `Dared. ${owner} will see “${film.title}”.`, ok: true });
    } catch (err) {
      setSent(s => { const next = { ...s }; delete next[film.id]; return next; });
      setMessage({ text: err instanceof Error ? err.message : 'Could not send that dare.', ok: false });
    }
  }

  return (
    <div className="dare-body">
      <div className="dare-main">
        <label htmlFor="dare-search" className="sr-only">Search for a film to dare</label>
        <div className="dare-input-wrap">
          <Search size={18} className="dare-input-icon" aria-hidden="true" />
          <input
            id="dare-search"
            type="search"
            className="field-input dare-input"
            placeholder="Search horror, thriller, sci-fi…"
            maxLength={60}
            autoComplete="off"
            value={query}
            onFocus={ensureToken}
            onChange={e => { ensureToken(); setQuery(e.target.value); }}
          />
        </div>
        <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="dare-hp" />

        {message && <p className={`dare-message${message.ok ? ' is-ok' : ' is-error'}`} role="status">{message.text}</p>}

        {shown && (shown.length ? (
          <ul className="dare-results">
            {shown.map(film => {
              const state = sent[film.id];
              return (
                <li key={film.id} className="dare-result">
                  <span className="dare-result-poster">
                    {film.poster && <Image src={film.poster} alt="" fill sizes="40px" />}
                  </span>
                  <span className="dare-result-title">
                    {film.title}
                    {film.year && <span className="dare-result-year"> {film.year}</span>}
                  </span>
                  {film.rated ? (
                    <span className="dare-result-note">Already rated</span>
                  ) : state === 'sent' ? (
                    <span className="dare-result-note is-sent"><Check size={14} aria-hidden="true" /> Dared</span>
                  ) : (
                    <button type="button" className="btn-secondary dare-btn" disabled={state === 'sending'} onClick={() => dare(film)}>
                      {state === 'sending' ? 'Daring…' : 'Dare'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="dare-empty">Nothing eligible matches that. Only released horror, thriller and sci-fi films can be dared.</p>
        ))}
      </div>

      <aside className="dare-top" aria-labelledby="dare-top-label">
        <h3 id="dare-top-label" className="dare-top-label">Most dared</h3>
        {top.length === 0 ? (
          <p className="dare-top-empty">No dares yet. Be the first.</p>
        ) : (
          <ol className="dare-top-list">
            {top.map(d => (
              <li key={d.tmdb_id}>
                <span className="dare-top-title">{d.title}{d.year ? <span className="dare-result-year"> {d.year}</span> : null}</span>
                <span className="dare-top-votes">{d.votes} dare{d.votes === 1 ? '' : 's'}</span>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
