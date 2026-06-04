'use client';

interface GenreDonutProps {
  data: { subgenre: string; count: number; pct: number }[];
}

export default function GenreDonut({ data }: GenreDonutProps) {
  if (!data.length) {
    return (
      <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No genre data yet.</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.count - a.count);
  const max = sorted[0]?.count ?? 1;

  return (
    <div className="stat-card">
      <p className="stat-card-label">Genre Breakdown</p>
      <div className="genre-bar-list">
        {sorted.map(item => (
          <div key={item.subgenre} className="genre-bar-row">
            <span className="genre-bar-name">{item.subgenre}</span>
            <div className="genre-bar-track">
              <div
                className="genre-bar-fill"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
            <span className="genre-bar-count">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
