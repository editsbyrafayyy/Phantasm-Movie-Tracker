'use client';

import { useMemo } from 'react';
import { SUBGENRE_HEX } from '@/lib/config';

interface SubgenreDistributionBarProps {
  entries:        { subgenre: string }[];
  activeGenre?:   string | null;
  /** When given, legend items become buttons that filter the grid. */
  onSelectGenre?: (genre: string) => void;
}

interface Slice { genre: string; label: string; count: number; pct: number; color: string; isOther?: boolean }

const OTHER_COLOR = 'var(--text-muted)';

export default function SubgenreDistributionBar({ entries, activeGenre, onSelectGenre }: SubgenreDistributionBarProps) {
  const slices = useMemo<Slice[]>(() => {
    if (!entries.length) return [];
    const counts = new Map<string, number>();
    for (const e of entries) {
      if (e.subgenre) counts.set(e.subgenre, (counts.get(e.subgenre) ?? 0) + 1);
    }
    const total = entries.length;
    const sorted: Slice[] = Array.from(counts, ([genre, count]) => ({
      genre,
      label: genre.replace(' Horror', '').replace(' (Non-Horror)', ''),
      count,
      pct: (count / total) * 100,
      color: SUBGENRE_HEX[genre] ?? 'var(--red)',
    })).sort((a, b) => b.count - a.count);

    const top = sorted.slice(0, 5);
    const restCount = sorted.slice(5).reduce((n, s) => n + s.count, 0);
    if (restCount > 0) {
      top.push({ genre: 'Other', label: 'Other', count: restCount, pct: (restCount / total) * 100, color: OTHER_COLOR, isOther: true });
    }
    return top;
  }, [entries]);

  if (!slices.length) return null;

  return (
    <section className="subgenre-makeup" aria-label="Subgenre makeup">
      <div className="subgenre-makeup-track" aria-hidden="true">
        {slices.map(s => (
          <span
            key={s.genre}
            className={`subgenre-makeup-seg${activeGenre && activeGenre !== s.genre ? ' is-dim' : ''}`}
            style={{ width: `${s.pct}%`, background: s.color }}
            title={`${s.genre}: ${s.count}`}
          />
        ))}
      </div>
      <ul className="subgenre-makeup-legend">
        {slices.map(s => {
          const content = (
            <>
              <span className="vault-dot" style={{ background: s.color }} aria-hidden="true" />
              <span>{s.label}</span>
              <span className="subgenre-makeup-pct">{Math.round(s.pct)}%</span>
            </>
          );
          return (
            <li key={s.genre}>
              {onSelectGenre && !s.isOther ? (
                <button
                  type="button"
                  className="subgenre-makeup-item"
                  aria-pressed={activeGenre === s.genre}
                  onClick={() => onSelectGenre(s.genre)}
                  title={`Show only ${s.genre}`}
                >
                  {content}
                </button>
              ) : (
                <span className="subgenre-makeup-item">{content}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
