import Image from 'next/image';
import { Film } from 'lucide-react';
import type { StatsData } from '@/lib/types';

interface TopRatedListProps {
  data: StatsData['topRated'];
}

export default function TopRatedList({ data }: TopRatedListProps) {
  if (!data.length) {
    return (
      <div className="chart-card chart-empty">
        <p>Add some films to see your top rated.</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <p className="section-label">Top Rated Films</p>
      <ol className="top-rated-list">
        {data.map((item, i) => (
          <li key={item.id} className={`top-rated-item${i % 2 === 1 ? ' alt' : ''}`}>
            <span className="top-rated-rank">{i + 1}</span>

            <div className="top-rated-poster" aria-hidden="true">
              {item.poster ? (
                <Image
                  src={item.poster}
                  alt=""
                  width={36}
                  height={52}
                  className="top-rated-poster-img"
                  sizes="48px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElFTkSuQmCC"
                />
              ) : (
                <div className="top-rated-poster-fallback">
                  <Film size={16} strokeWidth={1} />
                </div>
              )}
            </div>

            <a href={`/vault/${item.id}`} className="top-rated-title">{item.title}</a>

            <span className="top-rated-score">{item.total}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
