'use client';

interface Props {
  data: { date: string; total: number; title: string }[];
}

export default function RatingTimeline({ data }: Props) {
  const buckets = [
    { label: '0 – 1', min: 0,  max: 1.99 },
    { label: '2 – 3', min: 2,  max: 3.99 },
    { label: '4 – 5', min: 4,  max: 5.99 },
    { label: '6 – 7', min: 6,  max: 7.99 },
    { label: '8 – 9', min: 8,  max: 9.99 },
    { label: '10+',   min: 10, max: 99   },
  ];

  const counts = buckets.map(b => ({
    ...b,
    count: data.filter(d => d.total >= b.min && d.total <= b.max).length,
  }));

  const max = Math.max(...counts.map(c => c.count), 1);

  return (
    <div className="stat-card">
      <p className="stat-card-label">Score Distribution</p>
      <div className="score-dist-chart">
        {counts.map(b => (
          <div key={b.label} className="score-dist-col">
            <span className="score-dist-count">{b.count > 0 ? b.count : ''}</span>
            <div className="score-dist-bar-wrap">
              <div
                className="score-dist-bar-fill"
                style={{ height: `${(b.count / max) * 100}%` }}
              />
            </div>
            <span className="score-dist-label">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
