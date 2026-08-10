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
  const RECOMMEND_COLORS: Record<string, string> = {
    Peak:    '#9b59f5',
    Yes:     '#52b044',
    No:      '#e63232',
    Garbage: '#6b6b6b',
  };
  const recommendCounts = ['Peak', 'Yes', 'No', 'Garbage'].map(r => ({
    label: r,
    count: entries.filter(e => e.recommend === r).length,
    color: RECOMMEND_COLORS[r],
  })).filter(r => r.count > 0);
  const totalRecommend = recommendCounts.reduce((s, r) => s + r.count, 0);

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

      {/* ── Rating Insights ─────────────────────────────────────────── */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Rating Insights
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-dim)' }}>
            Median score: <strong style={{ color: 'var(--text)' }}>{median.toFixed(1)}</strong>
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-dim)' }}>
            <strong style={{ color: 'var(--text)' }}>{highSharePct}%</strong> of films rated 8 or higher
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-dim)' }}>
            Most common: <strong style={{ color: 'var(--text)' }}>{dominant.label}</strong> ({dominant.count} film{dominant.count === 1 ? '' : 's'})
          </span>
          {ratedTotals.length >= 5 && (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-dim)' }}>
              Score range: <strong style={{ color: 'var(--text)' }}>{minScore.toFixed(1)} – {maxScore.toFixed(1)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* ── Recommend Split ──────────────────────────────────────────── */}
      {totalRecommend > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Verdict Split
          </p>
          {/* Stacked segment bar */}
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
            {recommendCounts.map(r => (
              <div
                key={r.label}
                title={`${r.label}: ${r.count}`}
                style={{
                  width: `${(r.count / totalRecommend) * 100}%`,
                  background: r.color,
                  transition: 'width 0.5s ease',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
            {recommendCounts.map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-dim)' }}>
                  {r.label} <strong style={{ color: 'var(--text)' }}>{r.count}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Decade Breakdown ─────────────────────────────────────────── */}
      {decades.length > 1 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 14px' }}>
            Decade Breakdown
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {decades.map(d => {
              const pct = Math.round((d.count / maxDecade) * 100);
              return (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', width: 56, flexShrink: 0 }}>{d.label}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--red)', borderRadius: 3, opacity: 0.75, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-dim)', width: 24, textAlign: 'right' }}>{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

