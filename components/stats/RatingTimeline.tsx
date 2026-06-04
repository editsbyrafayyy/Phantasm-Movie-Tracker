'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Dot,
} from 'recharts';
import type { StatsData } from '@/lib/types';

interface RatingTimelineProps {
  data: StatsData['ratingOverTime'];
}

export default function RatingTimeline({ data }: RatingTimelineProps) {
  if (!data.length) {
    return (
      <div className="chart-card chart-empty">
        <p>No timeline data yet.</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <p className="section-label">Rating Over Time</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--chart-label)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--chart-axis)' }}
            tickLine={false}
            tickFormatter={d => {
              const date = new Date(d);
              return `${date.toLocaleString('default', { month: 'short' })} '${String(date.getFullYear()).slice(2)}`;
            }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--chart-label)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 10]}
            width={24}
          />
          <Tooltip
            contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
            formatter={(value, _name, props) => {
              const payload = (props as unknown as { payload: { title: string } }).payload;
              return [String(value ?? ''), payload.title];
            }}
            labelFormatter={label => new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="rgba(204,0,0,0.8)"
            strokeWidth={2}
            dot={<Dot r={3} fill="#CC0000" />}
            activeDot={{ r: 5, fill: '#CC0000', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
