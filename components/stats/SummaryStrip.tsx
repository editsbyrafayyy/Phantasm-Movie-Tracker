import type { StatsData } from '@/lib/types';

interface SummaryStripProps {
  stats: StatsData;
}

export default function SummaryStrip({ stats }: SummaryStripProps) {
  const items = [
    { value: stats.totalFilms,                       label: 'Films Logged'       },
    { value: stats.averageTotal.toFixed(2),           label: 'Avg Score'          },
    { value: stats.highestScore,                      label: 'Highest Score'      },
    { value: stats.mostCommonSubgenre || '—',         label: 'Top Subgenre'       },
  ];

  return (
    <div className="stats-summary-strip">
      {items.map((item, i) => (
        <div key={i} className="stats-summary-card">
          <span className="stats-summary-value">{item.value}</span>
          <span className="stats-summary-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
