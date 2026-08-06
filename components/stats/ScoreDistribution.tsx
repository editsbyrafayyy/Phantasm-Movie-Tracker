import type { Entry } from '@/lib/types';

interface ScoreDistributionProps {
  entries: Entry[];
}

export default function ScoreDistribution({ entries }: ScoreDistributionProps) {
  // Exclude unrated movies (total === null or total === 0)
  const ratedEntries = entries.filter(e => e.total !== null && e.total > 0);

  // Low-data guard: hide the entire card if there aren't enough rated films
  // for the insights to be meaningful (mirrors VaultWrapped.tsx pattern).
  if (ratedEntries.length < 3) return null;

  const ratedTotals = ratedEntries.map(e => e.total as number);

  const buckets = [
    { label: '0 – 2',  min: 0.01, max: 2.0 },
    { label: '2 – 4',  min: 2.01, max: 4.0 },
    { label: '4 – 6',  min: 4.01, max: 6.0 },
    { label: '6 – 8',  min: 6.01, max: 8.0 },
    { label: '8 – 10', min: 8.01, max: 10.0 }
  ];

  const counts = buckets.map(b => ({
    ...b,
    count: ratedEntries.filter(e => e.total! >= b.min && e.total! <= b.max).length,
  }));

  const max = Math.max(...counts.map(c => c.count), 1);

  // ── Insights ──────────────────────────────────────────────────────────
  // Sorted copy for median calculation.
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

  return (
    <div className="stat-card">
      <p className="stat-card-label">Score Distribution</p>
      <div className="score-dist-chart" style={{ display: 'flex', alignItems: 'flex-end', height: 160, gap: 16, marginTop: 24, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {counts.map(b => {
          const pct = (b.count / max) * 100;
          return (
            <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>{b.count > 0 ? b.count : ''}</span>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: 4, height: '100%', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${pct}%`,
                    background: 'linear-gradient(180deg, var(--red) 0%, rgba(230,50,50,0.3) 100%)',
                    borderRadius: 2,
                    transition: 'height 0.6s cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, whiteSpace: 'nowrap' }}>{b.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Rating Insights ────────────────────────────────────────── */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          margin: 0,
          marginBottom: 12,
        }}>
          Rating Insights
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Median score: {median.toFixed(1)}
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {highSharePct}% of films rated 8 or higher
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Most common: {dominant.label} ({dominant.count} film{dominant.count === 1 ? '' : 's'})
          </span>
          {ratedTotals.length >= 5 && (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Score range: {minScore.toFixed(1)} – {maxScore.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
