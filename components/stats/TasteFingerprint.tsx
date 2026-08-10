'use client';

import { useMemo } from 'react';
import type { Entry } from '@/lib/types';

interface Props {
  entries: Entry[];
}

interface Insight {
  subgenre: string;
  count: number;
  avgScore: number;
  delta: number;      // vs overall avg, as a %
  direction: 'higher' | 'lower';
}

function buildFingerprint(entries: Entry[]): { insights: Insight[]; overallAvg: number } | null {
  const rated = entries.filter(e => e.total !== null && e.total > 0);
  if (rated.length < 5) return null;

  const overallAvg = rated.reduce((s, e) => s + (e.total as number), 0) / rated.length;

  // Group by subgenre
  const bySubgenre: Record<string, number[]> = {};
  for (const e of rated) {
    if (!e.subgenre) continue;
    bySubgenre[e.subgenre] = bySubgenre[e.subgenre] ?? [];
    bySubgenre[e.subgenre].push(e.total as number);
  }

  const insights: Insight[] = Object.entries(bySubgenre)
    .filter(([, scores]) => scores.length >= 3)
    .map(([subgenre, scores]) => {
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      const delta = ((avg - overallAvg) / overallAvg) * 100;
      return {
        subgenre,
        count: scores.length,
        avgScore: avg,
        delta,
        direction: (delta >= 0 ? 'higher' : 'lower') as 'higher' | 'lower',
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 6);

  return { insights, overallAvg };
}

export default function TasteFingerprint({ entries }: Props) {
  const result = useMemo(() => buildFingerprint(entries), [entries]);

  if (!result || result.insights.length < 2) return null;
  const { insights, overallAvg } = result;

  return (
    <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
      <p className="stat-card-label">Personal Taste Fingerprint</p>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 20, marginTop: -8 }}>
        How your subgenre preferences compare to your overall average of{' '}
        <strong style={{ color: 'var(--text)' }}>{overallAvg.toFixed(1)}</strong>.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12,
      }}>
        {insights.map(ins => {
          const isHigher = ins.direction === 'higher';
          const absDelta = Math.abs(ins.delta);
          const color = isHigher ? '#52b044' : '#e63232';
          const bgColor = isHigher ? 'rgba(82,176,68,0.08)' : 'rgba(230,50,50,0.08)';
          const borderColor = isHigher ? 'rgba(82,176,68,0.25)' : 'rgba(230,50,50,0.25)';

          return (
            <div
              key={ins.subgenre}
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {ins.subgenre}
                </span>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 700,
                  color,
                }}>
                  {isHigher ? '+' : ''}{ins.delta.toFixed(0)}%
                </span>
              </div>

              {/* Diverging bar */}
              <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  [isHigher ? 'left' : 'right']: '50%',
                  width: `${Math.min(absDelta / 2, 50)}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 2,
                }} />
                {/* Center line */}
                <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: 'rgba(255,255,255,0.2)' }} />
              </div>

              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-dim)' }}>
                You rate {ins.subgenre}{' '}
                <strong style={{ color }}>{absDelta.toFixed(0)}% {ins.direction}</strong>{' '}
                than your avg · {ins.count} films · avg {ins.avgScore.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
