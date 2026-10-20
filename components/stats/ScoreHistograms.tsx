import { SCORE_FIELDS } from '@/lib/config';
import type { StatsData } from '@/lib/types';

interface ScoreHistogramsProps {
  data: StatsData['scoresByField'];
}

function buildBuckets(values: number[], max: number): { x: string; count: number }[] {
  const step = max <= 1 ? 0.25 : 0.5;
  const steps: number[] = [];
  for (let v = 0; v <= max; v += step) steps.push(Math.round(v * 100) / 100);
  return steps.map(s => ({ x: String(s), count: values.filter(v => v === s).length }));
}

export default function ScoreHistograms({ data }: ScoreHistogramsProps) {
  if (!data.length || data.every(d => d.values.length === 0)) {
    return (
      <div className="stat-card stat-card-wide stat-card-empty">
        <p>No score data yet.</p>
      </div>
    );
  }

  return (
    <div className="stat-card stat-card-wide">
      <h3 className="stat-card-label">Score distributions</h3>
      <div className="histograms-grid">
        {data.map(({ field, values }) => {
          const maxVal = SCORE_FIELDS.find(f => f.label === field)?.max ?? 2;
          const buckets = buildBuckets(values, maxVal);
          const maxCount = Math.max(...buckets.map(b => b.count), 1);

          return (
            <div key={field} className="histogram-cell">
              <p className="histogram-label">{field}</p>
              <div className="histogram-bars-container" role="img" aria-label={`${field} score distribution`}>
                {buckets.map(b => (
                  <div key={b.x} className="histogram-col" title={`${b.x}: ${b.count} films`}>
                    <div
                      className={`histogram-bar${b.count > 0 ? ' has-value' : ''}`}
                      style={b.count > 0 ? { height: `${(b.count / maxCount) * 80}%` } : undefined}
                    />
                  </div>
                ))}
              </div>
              <div className="histogram-axis">
                <span>0</span>
                <span>{maxVal}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
