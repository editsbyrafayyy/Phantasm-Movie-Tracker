'use client';

import type { StatsData } from '@/lib/types';

interface Props {
  stats: StatsData;
}

export default function SummaryStrip({ stats }: Props) {
  const tiles = [
    { label: 'Films Rated',  value: stats.totalFilms },
    { label: 'Avg Score',    value: stats.averageTotal },
    { label: 'Peak Score',   value: stats.highestScore },
    { label: 'Top Genre',    value: stats.mostCommonSubgenre || '—', isText: true },
  ];

  return (
    <div className="summary-strip">
      {tiles.map(t => (
        <div key={t.label} className="summary-tile">
          <span className={`summary-tile-value${t.isText ? ' text-value' : ''}`}>{t.value}</span>
          <span className="summary-tile-label">{t.label}</span>
        </div>
      ))}
    </div>
  );
}
