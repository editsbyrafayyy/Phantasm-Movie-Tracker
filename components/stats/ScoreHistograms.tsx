'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { SCORE_FIELDS } from '@/lib/config';
import type { StatsData } from '@/lib/types';

interface ScoreHistogramsProps {
  data: StatsData['scoresByField'];
}

export default function ScoreHistograms({ data }: ScoreHistogramsProps) {
  if (!data.length || data.every(d => d.values.length === 0)) {
    return (
      <div className="chart-card chart-empty">
        <p>No score data yet.</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <p className="section-label">Score Distributions</p>
      <div className="histograms-grid">
        {data.map(({ field, values }) => {
          const fieldDef = SCORE_FIELDS.find(f => f.label === field);
          const max      = fieldDef?.max ?? 2;
          // Build frequency buckets from 0 to max in 0.5 steps
          const buckets  = buildBuckets(values, max);

          return (
            <div key={field} className="histogram-item">
              <p className="histogram-label">{field}</p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={buckets} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="x"
                    tick={{ fill: 'var(--chart-label)', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                    formatter={(value) => [`${value ?? 0} films`, field]}
                  />
                  <Bar dataKey="count" fill="rgba(204,0,0,0.7)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildBuckets(values: number[], max: number): { x: string; count: number }[] {
  // Steps: 0, 0.5, 1, 1.5, 2 (for max=2) or 0, 0.25, 0.5, 0.75, 1 (for max=1)
  const step   = max <= 1 ? 0.25 : 0.5;
  const steps  = [];
  for (let v = 0; v <= max; v += step) steps.push(Math.round(v * 100) / 100);

  return steps.map(s => ({
    x:     String(s),
    count: values.filter(v => v === s).length,
  }));
}
