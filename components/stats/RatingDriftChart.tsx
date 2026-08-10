'use client';

import { useMemo } from 'react';
import type { Entry } from '@/lib/types';

interface Props {
  entries: Entry[];
}

// Compute monthly avg per subgenre
function buildDriftData(entries: Entry[]) {
  const rated = entries.filter(e => e.total !== null && e.total > 0 && e.created_at);

  // Find top 4 subgenres by count
  const subgenreCounts: Record<string, number> = {};
  for (const e of rated) {
    if (e.subgenre) subgenreCounts[e.subgenre] = (subgenreCounts[e.subgenre] ?? 0) + 1;
  }
  const topSubgenres = Object.entries(subgenreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([s]) => s);

  // Build month buckets — rolling last 12 months
  const now = new Date();
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  // ── O(N) pre-grouping: build month×subgenre buckets in a single pass ─────
  const grouped = new Map<string, number[]>(); // key: 'subgenre|YYYY-MM'
  for (const e of rated) {
    if (!e.subgenre || !e.created_at) continue;
    const month = e.created_at.slice(0, 7);
    const key = `${e.subgenre}|${month}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e.total as number);
  }

  // For each subgenre × month compute avg from pre-grouped map
  const series: Record<string, (number | null)[]> = {};
  for (const sg of topSubgenres) {
    series[sg] = months.map(month => {
      const vals = grouped.get(`${sg}|${month}`);
      if (!vals || !vals.length) return null;
      return vals.reduce((s, v) => s + v, 0) / vals.length;
    });
  }

  return { topSubgenres, months, series };
}

const LINE_COLORS = ['#e63232', '#9b59f5', '#52b044', '#f5a623'];

export default function RatingDriftChart({ entries }: Props) {
  const { topSubgenres, months, series } = useMemo(() => buildDriftData(entries), [entries]);

  if (months.length < 2 || topSubgenres.length < 2) return null;

  const W = 580;
  const H = 160;
  const PAD = { top: 12, right: 16, bottom: 28, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minY = 0;
  const maxY = 10;

  function xPos(i: number) {
    return PAD.left + (i / (months.length - 1)) * chartW;
  }
  function yPos(v: number) {
    return PAD.top + chartH - ((v - minY) / (maxY - minY)) * chartH;
  }

  // Build polyline points for each subgenre (skip null gaps)
  function buildSegments(vals: (number | null)[]): string[][] {
    const segments: string[][] = [];
    let current: string[] = [];
    vals.forEach((v, i) => {
      if (v !== null) {
        current.push(`${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`);
      } else {
        if (current.length > 1) segments.push(current);
        current = [];
      }
    });
    if (current.length > 1) segments.push(current);
    return segments;
  }

  // Y-axis gridlines at 2, 4, 6, 8
  const gridLines = [2, 4, 6, 8, 10];

  // Month labels — show only if space allows (every 2nd)
  const step = months.length > 8 ? 2 : 1;
  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
      <p className="stat-card-label">Rating Drift — Score Trends by Subgenre</p>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16, marginTop: -8 }}>
        How your average score per subgenre has changed month by month this year.
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginBottom: 16 }}>
        {topSubgenres.map((sg, i) => (
          <div key={sg} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 3, background: LINE_COLORS[i], borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-sans)' }}>{sg}</span>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        aria-label="Rating drift line chart"
      >
        {/* Grid lines */}
        {gridLines.map(g => (
          <g key={g}>
            <line
              x1={PAD.left} y1={yPos(g)} x2={W - PAD.right} y2={yPos(g)}
              stroke="rgba(255,255,255,0.05)" strokeWidth={1}
            />
            <text x={PAD.left - 5} y={yPos(g)} textAnchor="end" dominantBaseline="middle"
              fontSize={9} fill="rgba(255,255,255,0.3)">{g}</text>
          </g>
        ))}

        {/* Month labels */}
        {months.map((m, i) => {
          if (i % step !== 0 && i !== months.length - 1) return null;
          const monthIdx = parseInt(m.slice(5, 7), 10) - 1;
          const yr = m.slice(2, 4); // '24', '25'
          const showYear = monthIdx === 0 || i === 0; // Jan or first label
          return (
            <text key={m} x={xPos(i)} y={H - 4} textAnchor="middle"
              fontSize={9} fill="rgba(255,255,255,0.35)">
              {MONTH_ABBR[monthIdx]}{showYear ? ` '${yr}` : ''}
            </text>
          );
        })}

        {/* Lines */}
        {topSubgenres.map((sg, si) => {
          const vals = series[sg];
          const segments = buildSegments(vals);
          return segments.map((seg, idx) => (
            <polyline
              key={`${sg}-${idx}`}
              points={seg.join(' ')}
              fill="none"
              stroke={LINE_COLORS[si]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          ));
        })}

        {/* Dots */}
        {topSubgenres.map((sg, si) => {
          const vals = series[sg];
          return vals.map((v, i) => {
            if (v === null) return null;
            return (
              <circle
                key={`${sg}-dot-${i}`}
                cx={xPos(i)} cy={yPos(v)}
                r={3} fill={LINE_COLORS[si]}
                stroke="var(--surface)" strokeWidth={1.5}
              >
                <title>{sg}: {v.toFixed(1)} in {months[i]}</title>
              </circle>
            );
          });
        })}
      </svg>
    </div>
  );
}
