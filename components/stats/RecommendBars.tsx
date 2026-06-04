'use client';

import { RECOMMEND_COLOR } from '@/lib/config';
import type { StatsData } from '@/lib/types';

interface RecommendBarsProps {
  data: StatsData['byRecommend'];
}

export default function RecommendBars({ data }: RecommendBarsProps) {
  if (!data.length) {
    return (
      <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recommendation data yet.</p>
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="stat-card">
      <p className="stat-card-label">Recommendation Breakdown</p>
      <div className="recommend-bar-list" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {data.map(item => (
          <div key={item.recommend} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 36px', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500 }}>{item.recommend}</span>
            <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: RECOMMEND_COLOR[item.recommend] ?? '#666',
                  borderRadius: 4,
                  width: `${(item.count / max) * 100}%`,
                  transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
