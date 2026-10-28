'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { FilmRef } from '@/lib/profileStats';
import FilmThumb from './FilmThumb';

type Kind = 'films' | 'series';
const KINDS: { value: Kind; label: string }[] = [
  { value: 'films',  label: 'Films' },
  { value: 'series', label: 'Series' },
];

/**
 * Top-rated films and series, ranked separately (a season of TV and a 90-minute film
 * shouldn't compete). The toggle only appears once a series has been rated.
 * `who`: whose list this is on a public page (default: the signed-in reader's own).
 */
export default function TopTenRow({ films, series = [], who }: { films: FilmRef[]; series?: FilmRef[]; who?: string }) {
  const [kind, setKind] = useState<Kind>(films.length ? 'films' : 'series');
  if (!films.length && !series.length) return null;

  const list = kind === 'films' ? films : series;
  const owner = who ? `${who}’s` : 'Your';

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next: Kind = kind === 'films' ? 'series' : 'films';
    setKind(next);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next}"]`)?.focus();
  };

  return (
    <section className="stat-card stat-card-wide" aria-labelledby="pstat-top">
      <div className="pstat-top-head">
        <h3 id="pstat-top" className="stat-card-label">
          {owner} top {list.length} {kind === 'films' ? (list.length === 1 ? 'film' : 'films') : 'series'}
        </h3>
        {films.length > 0 && series.length > 0 && (
          <div
            className="browse-segmented pstat-top-toggle"
            role="radiogroup"
            aria-label="Show top films or series"
            onKeyDown={onKey}
            style={{ '--seg-index': kind === 'films' ? 0 : 1 } as React.CSSProperties}
          >
            <span className="browse-segment-pill" aria-hidden="true" />
            {KINDS.map(k => (
              <button
                key={k.value}
                type="button"
                role="radio"
                aria-checked={kind === k.value}
                tabIndex={kind === k.value ? 0 : -1}
                data-value={k.value}
                className={`browse-segment${kind === k.value ? ' is-active' : ''}`}
                onClick={() => setKind(k.value)}
              >
                {k.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <ol className="pstat-top-row" key={kind}>
        {list.map((f, i) => (
          <li key={f.id}>
            <Link href={`/vault/${f.id}`} className="pstat-top-item">
              <FilmThumb src={f.poster} className="pstat-top-poster" />
              <span className="pstat-top-rank">{i + 1}</span>
              <span className="pstat-top-title">{f.title}</span>
              <span className="pstat-top-score">{f.total}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
