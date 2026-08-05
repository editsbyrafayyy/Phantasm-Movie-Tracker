import type { StatsData } from '@/lib/types';

interface Props {
  stats: StatsData;
}

function formatRuntime(totalMin: number = 0): string {
  if (!totalMin || totalMin <= 0) return '—';
  const hours = Math.floor(totalMin / 60);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  if (days > 0) {
    return `${days}d ${remHours}h`;
  }
  return `${hours}h`;
}

export default function SummaryStrip({ stats }: Props) {
  const tiles = [
    { label: 'Films Rated',  value: stats.totalFilms },
    { label: 'Time Watched', value: formatRuntime(stats.totalRuntimeMin), isText: true },
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
