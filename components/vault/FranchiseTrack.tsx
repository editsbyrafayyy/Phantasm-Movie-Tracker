'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, Layers } from 'lucide-react';
import { getMovieFranchise } from '@/lib/config';
import type { Entry } from '@/lib/types';

interface FranchiseTrackProps {
  currentEntry: Entry;
  allEntries: Entry[];
}

export default function FranchiseTrack({ currentEntry, allEntries }: FranchiseTrackProps) {
  const currentTitle = currentEntry.movie?.title ?? '';
  const franchiseName = useMemo(() => getMovieFranchise(currentTitle), [currentTitle]);

  const series = useMemo(() => {
    if (!franchiseName) return [];
    return allEntries
      .filter(e => {
        const title = e.movie?.title ?? '';
        return getMovieFranchise(title) === franchiseName;
      })
      .sort((a, b) => (a.movie?.year ?? 0) - (b.movie?.year ?? 0));
  }, [franchiseName, allEntries]);

  if (!franchiseName || series.length < 2) return null;

  return (
    <div className="franchise-track-section">
      <div className="franchise-track-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} style={{ color: 'var(--red)' }} />
          <span className="franchise-track-title">{franchiseName}</span>
        </div>
        <span className="franchise-track-count">{series.length} Films</span>
      </div>

      <div className="franchise-track-row">
        {series.map(entry => {
          const isCurrent = entry.id === currentEntry.id;
          const poster = entry.movie?.poster_url;
          const title = entry.movie?.title ?? 'Unknown';
          const year = entry.movie?.year;

          return (
            <Link
              key={entry.id}
              href={`/vault/${entry.id}`}
              className={`franchise-track-card${isCurrent ? ' active' : ''}`}
            >
              <div className="franchise-poster-wrap">
                {poster ? (
                  <Image
                    src={`/_next/image?url=${encodeURIComponent(poster)}&w=200&q=70`}
                    alt={title}
                    fill
                    sizes="100px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  <div className="franchise-poster-fallback">
                    <Film size={20} />
                  </div>
                )}
                {entry.total !== null && entry.total > 0 && (
                  <span className="franchise-score-badge">{entry.total}</span>
                )}
                {isCurrent && <div className="franchise-current-badge">NOW</div>}
              </div>
              <p className="franchise-card-title">{title}</p>
              {year && <p className="franchise-card-year">{year}</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
