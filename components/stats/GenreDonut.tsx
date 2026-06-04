'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SUBGENRE_HEX } from '@/lib/config';
import type { StatsData } from '@/lib/types';

interface GenreDonutProps {
  data: StatsData['bySubgenre'];
}

export default function GenreDonut({ data }: GenreDonutProps) {
  if (!data.length) return <EmptyChart label="No genre data yet." />;

  const total = data.reduce((a, b) => a + b.count, 0);

  return (
    <div className="chart-card">
      <p className="section-label">Genre Breakdown</p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="subgenre"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="var(--bg)"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell
                key={entry.subgenre}
                fill={SUBGENRE_HEX[entry.subgenre] ?? '#666'}
              />
            ))}
          </Pie>
          <text
            x="50%" y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="chart-donut-label"
            fill="var(--text)"
            fontFamily="'Bebas Neue', sans-serif"
            fontSize={32}
          >
            {total}
          </text>
          <Tooltip
            contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
            formatter={(value, name) => [`${value ?? 0} (${data.find(d => d.subgenre === String(name))?.pct ?? 0}%)`, String(name)]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'var(--text-dim)', paddingTop: 12 }}
            formatter={(value) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="chart-card chart-empty">
      <p>{label}</p>
    </div>
  );
}
