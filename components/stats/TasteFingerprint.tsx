import type { Entry } from '@/lib/types';

interface Props {
  entries: Entry[];
}

interface Insight {
  subgenre: string;
  count: number;
  avgScore: number;
  delta: number;      // vs overall avg, as a %
  direction: 'higher' | 'lower';
}

function buildFingerprint(entries: Entry[]): { insights: Insight[]; overallAvg: number } | null {
  const rated = entries.filter(e => e.total !== null && e.total > 0);
  if (rated.length < 5) return null;

  const overallAvg = rated.reduce((s, e) => s + (e.total as number), 0) / rated.length;

  // Group by subgenre
  const bySubgenre: Record<string, number[]> = {};
  for (const e of rated) {
    if (!e.subgenre) continue;
    bySubgenre[e.subgenre] = bySubgenre[e.subgenre] ?? [];
    bySubgenre[e.subgenre].push(e.total as number);
  }

  const insights: Insight[] = Object.entries(bySubgenre)
    .filter(([, scores]) => scores.length >= 3)
    .map(([subgenre, scores]) => {
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      const delta = ((avg - overallAvg) / overallAvg) * 100;
      return {
        subgenre,
        count: scores.length,
        avgScore: avg,
        delta,
        direction: (delta >= 0 ? 'higher' : 'lower') as 'higher' | 'lower',
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 6);

  return { insights, overallAvg };
}

export default function TasteFingerprint({ entries }: Props) {
  const result = buildFingerprint(entries);

  if (!result || result.insights.length < 2) return null;
  const { insights, overallAvg } = result;

  return (
    <div className="stat-card stat-card-wide">
      <h3 className="stat-card-label">Taste fingerprint</h3>
      <p className="stat-card-desc">
        How each subgenre scores against your overall average of <strong>{overallAvg.toFixed(1)}</strong>.
      </p>

      <div className="taste-grid">
        {insights.map(ins => {
          const isHigher = ins.direction === 'higher';
          const absDelta = Math.abs(ins.delta);
          return (
            <div key={ins.subgenre} className={`taste-card ${isHigher ? 'is-higher' : 'is-lower'}`}>
              <div className="taste-card-head">
                <span className="taste-card-name">{ins.subgenre}</span>
                <span className="taste-card-delta">{isHigher ? '+' : '−'}{absDelta.toFixed(0)}%</span>
              </div>
              <div className="taste-bar" aria-hidden="true">
                <span
                  className="taste-bar-fill"
                  style={{ width: `${Math.min(absDelta / 2, 50)}%` }}
                />
              </div>
              <span className="taste-card-sub">
                avg {ins.avgScore.toFixed(1)} · {ins.count} films
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
