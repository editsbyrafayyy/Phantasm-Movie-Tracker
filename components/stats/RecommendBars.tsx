import { RECOMMEND_COLOR } from '@/lib/config';
import type { StatsData } from '@/lib/types';

interface RecommendBarsProps {
  data: StatsData['byRecommend'];
}

export default function RecommendBars({ data }: RecommendBarsProps) {
  if (!data.length) {
    return (
      <div className="stat-card stat-card-empty">
        <p>No verdicts yet.</p>
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="stat-card">
      <h3 className="stat-card-label">Verdicts</h3>
      <div className="genre-bar-list">
        {data.map(item => (
          <div key={item.recommend} className="genre-bar-row">
            <span className="genre-bar-name">{item.recommend}</span>
            <div className="genre-bar-track">
              <div
                className="genre-bar-fill"
                style={{ width: `${(item.count / max) * 100}%`, background: RECOMMEND_COLOR[item.recommend] ?? 'var(--text-muted)' }}
              />
            </div>
            <span className="genre-bar-count">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
