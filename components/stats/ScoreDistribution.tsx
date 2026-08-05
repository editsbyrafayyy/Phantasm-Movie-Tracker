import type { Entry } from '@/lib/types';

interface ScoreDistributionProps {
  entries: Entry[];
}

export default function ScoreDistribution({ entries }: ScoreDistributionProps) {
  // Exclude unrated movies (total === null or total === 0)
  const ratedEntries = entries.filter(e => e.total !== null && e.total > 0);

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

  return (
    <div className="stat-card">
      <p className="stat-card-label">Score Distribution</p>
      <div className="score-dist-chart" style={{ display: 'flex', alignItems: 'flex-end', height: 160, gap: 16, marginTop: 24, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {counts.map(b => {
          const pct = (b.count / max) * 100;
          return (
            <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600, marginBottom: 6 }}>{b.count > 0 ? b.count : ''}</span>
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
    </div>
  );
}
