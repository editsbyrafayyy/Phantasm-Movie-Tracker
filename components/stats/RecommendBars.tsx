'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from 'recharts';
import { RECOMMEND_COLOR } from '@/lib/config';
import type { StatsData } from '@/lib/types';

interface RecommendBarsProps {
  data: StatsData['byRecommend'];
}

export default function RecommendBars({ data }: RecommendBarsProps) {
  if (!data.length) {
    return (
      <div className="chart-card chart-empty">
        <p>No recommendation data yet.</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <p className="section-label">Recommendation Breakdown</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 32, bottom: 8, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'var(--chart-label)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--chart-axis)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="recommend"
            tick={{ fill: 'var(--text-dim)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
            formatter={(value, _name, props) => {
              const payload = (props as unknown as { payload: { pct: number } }).payload;
              return [`${value ?? 0} films (${payload.pct}%)`];
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map(entry => (
              <Cell
                key={entry.recommend}
                fill={RECOMMEND_COLOR[entry.recommend] ?? '#666'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
