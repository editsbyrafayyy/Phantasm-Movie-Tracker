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
  const top = sorted.slice(0, 8);
  const rest = sorted.slice(8);
  const restCount = rest.reduce((acc, item) => acc + item.count, 0);
  const list = restCount > 0
    ? [...top, { subgenre: 'Other', count: restCount, pct: rest.reduce((acc, item) => acc + item.pct, 0) }]
    : top;
  const max = list[0]?.count ?? 1;

  return (
    <div className="stat-card">
      <p className="stat-card-label">Top Genres</p>
      <div className="genre-bar-list">
        {list.map(item => (
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
