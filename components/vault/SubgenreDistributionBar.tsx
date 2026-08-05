'use client';

import { useMemo } from 'react';
import type { Entry } from '@/lib/types';
import { SUBGENRE_HEX } from '@/lib/config';

interface SubgenreDistributionBarProps {
  entries: Entry[];
}

export default function SubgenreDistributionBar({ entries }: SubgenreDistributionBarProps) {
  const distribution = useMemo(() => {
    if (!entries.length) return [];

    const counts = new Map<string, number>();
    for (const e of entries) {
      if (!e.subgenre) continue;
      counts.set(e.subgenre, (counts.get(e.subgenre) ?? 0) + 1);
    }

    const total = entries.length;
    const sorted = Array.from(counts.entries())
      .map(([genre, count]) => ({
        genre,
        shortGenre: genre.replace(' Horror', '').replace(' (Non-Horror)', ''),
        count,
        pct: Math.round((count / total) * 100),
        color: SUBGENRE_HEX[genre] ?? 'var(--red)',
      }))
      .sort((a, b) => b.count - a.count);

    // Keep top 4 and combine remaining into "Other"
    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4);

    if (rest.length > 0) {
      const restCount = rest.reduce((acc, curr) => acc + curr.count, 0);
      const restPct = Math.round((restCount / total) * 100);
      if (restPct > 0) {
        top.push({
          genre: 'Other',
          shortGenre: 'Other',
          count: restCount,
          pct: restPct,
          color: 'var(--border-strong)',
        });
      }
    }

    return top;
  }, [entries]);

  if (!distribution.length) return null;

  return (
    <div
      className="subgenre-distribution-bar-wrap"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>
          Vault Subgenre Makeup
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          {entries.length} total film{entries.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Multi-segment progress track */}
      <div
        style={{
          display: 'flex',
          height: 6,
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          background: 'var(--surface-2)',
          marginBottom: 10,
        }}
      >
        {distribution.map(item => (
          <div
            key={item.genre}
            style={{
              width: `${item.pct}%`,
              background: item.color,
              transition: 'width 0.4s ease',
            }}
            title={`${item.genre}: ${item.count} (${item.pct}%)`}
          />
        ))}
      </div>

      {/* Legend list */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-dim)' }}>
        {distribution.map(item => (
          <div key={item.genre} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: item.color,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span>
              {item.shortGenre} <strong style={{ color: 'var(--text)' }}>{item.pct}%</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
