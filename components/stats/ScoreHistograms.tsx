'use client';

import { SCORE_FIELDS } from '@/lib/config';
import type { StatsData } from '@/lib/types';

interface ScoreHistogramsProps {
  data: StatsData['scoresByField'];
}

export default function ScoreHistograms({ data }: ScoreHistogramsProps) {
  if (!data.length || data.every(d => d.values.length === 0)) {
    return (
      <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No score data yet.</p>
      </div>
    );
  }

  return (
    <div className="stat-card" style={{ gridColumn: 'span 2' }}>
      <p className="stat-card-label" style={{ marginBottom: 20 }}>Score Distributions</p>
      <div className="histograms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
        {data.map(({ field, values }) => {
          const fieldDef = SCORE_FIELDS.find(f => f.label === field);
          const maxVal = fieldDef?.max ?? 2;
          const buckets = buildBuckets(values, maxVal);
          const maxCount = Math.max(...buckets.map(b => b.count), 1);

          return (
            <div key={field} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-light)', marginBottom: 12 }}>{field}</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 4, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {buckets.map(b => {
                  const heightPct = (b.count / maxCount) * 80;
                  return (
                    <div
                      key={b.x}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                      }}
                      title={`${b.x}: ${b.count} films`}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: b.count > 0 ? `${heightPct}%` : '2px',
                          background: b.count > 0 ? 'rgba(230, 50, 50, 0.75)' : 'rgba(255,255,255,0.05)',
                          borderRadius: '2px 2px 0 0',
                          transition: 'height 0.6s cubic-bezier(0.22,1,0.36,1)',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>0</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{maxVal}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildBuckets(values: number[], max: number): { x: string; count: number }[] {
  const step = max <= 1 ? 0.25 : 0.5;
  const steps = [];
  for (let v = 0; v <= max; v += step) steps.push(Math.round(v * 100) / 100);

  return steps.map(s => ({
    x: String(s),
    count: values.filter(v => v === s).length,
  }));
}
