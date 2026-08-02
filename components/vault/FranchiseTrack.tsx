'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, Layers, CheckCircle2, Award, RotateCcw } from 'lucide-react';
import { getMovieFranchise, FRANCHISE_TOTALS } from '@/lib/config';
import type { Entry } from '@/lib/types';

interface FranchiseTrackProps {
  currentEntry: Entry;
  allEntries: Entry[];
  diaryMap?: Record<string, number>;
}

export default function FranchiseTrack({ currentEntry, allEntries, diaryMap }: FranchiseTrackProps) {
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

  const totalFilms = useMemo(() => {
    if (!franchiseName) return 0;
    return FRANCHISE_TOTALS[franchiseName] ?? series.length;
  }, [franchiseName, series.length]);

  if (!franchiseName || series.length < 2) return null;

  const isComplete = series.length >= totalFilms && totalFilms > 0;
  const pct = Math.min(100, Math.round((series.length / totalFilms) * 100));

  // Progress ring math (radius = 9, stroke = 2.5, circumference = 2 * PI * 9 ≈ 56.55)
  const radius = 9;
  const stroke = 2.5;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (pct / 100) * circ;

  return (
    <div className={`franchise-track-section${isComplete ? ' is-complete' : ''}`}>
      <div className="franchise-track-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Layers size={16} style={{ color: isComplete ? '#ffd700' : 'var(--red)' }} />
          <span className="franchise-track-title">{franchiseName}</span>
          {isComplete && (
            <span className="franchise-complete-badge">
              <Award size={13} />
              <span>COMPLETE</span>
            </span>
          )}
        </div>
        
        <div className="franchise-progress-meta">
          <svg className="franchise-progress-ring" width="24" height="24" viewBox="0 0 24 24">
            <circle
              className="franchise-ring-bg"
              cx="12" cy="12" r={radius}
              strokeWidth={stroke}
            />
            <circle
              className={`franchise-ring-fill${isComplete ? ' complete' : ''}`}
              cx="12" cy="12" r={radius}
              strokeWidth={stroke}
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <span className="franchise-track-count">{series.length}/{totalFilms} Watched</span>
        </div>
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
                {entry.movie?.id && diaryMap && (diaryMap[entry.movie.id] ?? 0) > 1 && (
                  <span className="franchise-rewatch-badge" title={`${diaryMap[entry.movie.id]} viewings`}>
                    <RotateCcw size={9} /> {diaryMap[entry.movie.id]}×
                  </span>
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
