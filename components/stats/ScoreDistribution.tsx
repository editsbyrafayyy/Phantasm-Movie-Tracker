import { RECOMMEND_COLOR } from '@/lib/config';
import type { Entry } from '@/lib/types';

interface ScoreDistributionProps {
  entries: Entry[];
}

export default function ScoreDistribution({ entries }: ScoreDistributionProps) {
  // Exclude unrated movies (total === null or total === 0)
  const ratedEntries = entries.filter(e => e.total !== null && e.total > 0);

  // Low-data guard
  if (ratedEntries.length < 3) return null;

  const ratedTotals = ratedEntries.map(e => e.total as number);

  const buckets = [
    { label: '0 – 2',  min: 0.01, max: 2.0 },
    { label: '2 – 4',  min: 2.01, max: 4.0 },
    { label: '4 – 6',  min: 4.01, max: 6.0 },
    { label: '6 – 8',  min: 6.01, max: 8.0 },
    { label: '8 – 10', min: 8.01, max: 10.0 },
  ];

  const counts = buckets.map(b => ({
    ...b,
    count: ratedEntries.filter(e => e.total! >= b.min && e.total! <= b.max).length,
  }));

  const max = Math.max(...counts.map(c => c.count), 1);

  // ── Insights ──────────────────────────────────────────────────────────
  const sorted = [...ratedTotals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  const highSharePct = Math.round(
    (ratedTotals.filter(t => t >= 8).length / ratedTotals.length) * 100
  );

  const dominant = counts.reduce((a, b) => (b.count > a.count ? b : a), counts[0]);
  const minScore = Math.min(...ratedTotals);
  const maxScore = Math.max(...ratedTotals);

  // ── Decade Breakdown ──────────────────────────────────────────────────
  const decadeBuckets = [
    { label: 'Pre-1980', test: (y: number) => y < 1980 },
    { label: '1980s',    test: (y: number) => y >= 1980 && y < 1990 },
    { label: '1990s',    test: (y: number) => y >= 1990 && y < 2000 },
    { label: '2000s',    test: (y: number) => y >= 2000 && y < 2010 },
    { label: '2010s',    test: (y: number) => y >= 2010 && y < 2020 },
    { label: '2020s',    test: (y: number) => y >= 2020 },
  ];
  const decades = decadeBuckets
    .map(b => ({
      label: b.label,
      count: entries.filter(e => e.movie?.year && b.test(e.movie.year)).length,
    }))
    .filter(d => d.count > 0);
  const maxDecade = Math.max(...decades.map(d => d.count), 1);

  // ── Recommend Split ───────────────────────────────────────────────────
  const recommendCounts = ['Peak', 'Yes', 'No', 'Garbage'].map(r => ({
    label: r,
    count: entries.filter(e => e.recommend === r).length,
    color: RECOMMEND_COLOR[r],
  })).filter(r => r.count > 0);
  const totalRecommend = recommendCounts.reduce((s, r) => s + r.count, 0);

  return (
    <div className="stat-card">
      <h3 className="stat-card-label">Score distribution</h3>
      <div className="score-dist-chart" role="img" aria-label="Number of films per score range">
        {counts.map(b => (
          <div key={b.label} className="score-dist-col">
            <span className="score-dist-count">{b.count > 0 ? b.count : ''}</span>
            <div className="score-dist-bar-wrap">
              <div className="score-dist-bar-fill" style={{ height: `${(b.count / max) * 100}%` }} />
            </div>
            <span className="score-dist-label">{b.label}</span>
          </div>
        ))}
      </div>

      <div className="stat-subsection">
        <h4 className="stat-subsection-title">Insights</h4>
        <ul className="stat-facts">
          <li>Median score: <strong>{median.toFixed(1)}</strong></li>
          <li><strong>{highSharePct}%</strong> of films rated 8 or higher</li>
          <li>Most common: <strong>{dominant.label}</strong> ({dominant.count} film{dominant.count === 1 ? '' : 's'})</li>
          {ratedTotals.length >= 5 && (
            <li>Score range: <strong>{minScore.toFixed(1)} – {maxScore.toFixed(1)}</strong></li>
          )}
        </ul>
      </div>

      {totalRecommend > 0 && (
        <div className="stat-subsection">
          <h4 className="stat-subsection-title">Verdict split</h4>
          <div className="stat-stack-bar" aria-hidden="true">
            {recommendCounts.map(r => (
              <span
                key={r.label}
                title={`${r.label}: ${r.count}`}
                style={{ width: `${(r.count / totalRecommend) * 100}%`, background: r.color }}
              />
            ))}
          </div>
          <ul className="stat-legend">
            {recommendCounts.map(r => (
              <li key={r.label} className="stat-legend-item">
                <span className="stat-legend-dot" style={{ background: r.color }} />
                {r.label} <strong>{r.count}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {decades.length > 1 && (
        <div className="stat-subsection">
          <h4 className="stat-subsection-title">Decades</h4>
          <div className="genre-bar-list">
            {decades.map(d => (
              <div key={d.label} className="genre-bar-row">
                <span className="genre-bar-name">{d.label}</span>
                <div className="genre-bar-track">
                  <div className="genre-bar-fill" style={{ width: `${Math.round((d.count / maxDecade) * 100)}%` }} />
                </div>
                <span className="genre-bar-count">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
