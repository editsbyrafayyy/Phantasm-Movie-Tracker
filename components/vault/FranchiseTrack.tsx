'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMovieFranchise, FRANCHISE_TOTALS } from '@/lib/config';
import type { RelatedEntry } from '@/lib/types';
import { gridPosterUrl } from './posterSrc';

interface FranchiseTrackProps {
  currentId:    string;
  currentTitle: string;
  /** Candidate entries (usually pre-filtered to this franchise on the server). */
  entries:      RelatedEntry[];
}

export default function FranchiseTrack({ currentId, currentTitle, entries }: FranchiseTrackProps) {
  const franchiseName = useMemo(() => getMovieFranchise(currentTitle), [currentTitle]);

  const series = useMemo(() => {
    if (!franchiseName) return [];
    return entries
      .filter(e => {
        const title = e.movie?.title ?? '';
        return getMovieFranchise(title) === franchiseName;
      })
      .sort((a, b) => (a.movie?.year ?? 0) - (b.movie?.year ?? 0));
  }, [franchiseName, entries]);

  const totalFilms = useMemo(() => {
    if (!franchiseName) return 0;
    return Math.max(FRANCHISE_TOTALS[franchiseName] ?? 0, series.length);
  }, [franchiseName, series.length]);

  // Carousel & Scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  // ResizeObserver fires once on observe and on every size change — no sync setState in the effect.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    return () => ro.disconnect();
  }, [series, updateScrollState]);

  // Scroll to active movie on initial mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeCard = el.querySelector('.franchise-track-card.active') as HTMLElement | null;
    if (activeCard) {
      const offset = activeCard.offsetLeft - el.clientWidth / 2 + activeCard.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    }
  }, []);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  // Mouse Drag to Scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    hasDragged.current = false;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragStartScrollLeft.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const el = scrollRef.current;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDragged.current = true;
    }
    el.scrollLeft = dragStartScrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  if (!franchiseName || series.length < 2) return null;

  const isComplete = series.length >= totalFilms && totalFilms > 0;
  const pct = Math.min(100, Math.round((series.length / totalFilms) * 100));

  return (
    <section
      className={`vdetail-section franchise-track-section${isComplete ? ' is-complete' : ''}`}
      aria-labelledby="franchise-track-heading"
    >
      <div className="franchise-track-header">
        <div className="franchise-title-group">
          <h2 id="franchise-track-heading" className="vdetail-h2">{franchiseName}</h2>
          <div className="franchise-progress" aria-label={`${series.length} of ${totalFilms} films rated`}>
            <span className="franchise-progress-count">
              {series.length} of {totalFilms} rated{isComplete ? ' · complete' : ''}
            </span>
            <span className="franchise-progress-bar-bg" aria-hidden="true">
              <span className="franchise-progress-bar-fill" style={{ width: `${pct}%` }} />
            </span>
          </div>
        </div>

        {(canScrollLeft || canScrollRight) && (
          <div className="franchise-nav-buttons">
            <button
              type="button"
              className="icon-btn franchise-nav-btn"
              onClick={() => scrollByAmount('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-btn franchise-nav-btn"
              onClick={() => scrollByAmount('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div className={`franchise-carousel-wrapper${canScrollLeft ? ' has-left-fade' : ''}${canScrollRight ? ' has-right-fade' : ''}`}>
        <div
          ref={scrollRef}
          className={`franchise-track-row${isDragging ? ' is-dragging' : ''}`}
          onScroll={updateScrollState}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {series.map(entry => {
            const isCurrent = entry.id === currentId;
            const poster = gridPosterUrl(entry.movie?.poster_url ?? null);
            const title = entry.movie?.title ?? 'Unknown';
            const year = entry.movie?.year;
            const scored = entry.total !== null && entry.total > 0;

            return (
              <Link
                key={entry.id}
                href={`/vault/${entry.id}`}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`${title}${year ? ` (${year})` : ''}${scored ? `, score ${entry.total}` : ''}${isCurrent ? ', this film' : ''}`}
                className={`franchise-track-card${isCurrent ? ' active' : ''}`}
                onClick={(e) => {
                  if (hasDragged.current) {
                    e.preventDefault();
                    hasDragged.current = false;
                  }
                }}
                draggable={false}
              >
                <div className="franchise-poster-wrap">
                  {poster ? (
                    <Image
                      src={poster}
                      alt=""
                      fill
                      sizes="106px"
                      className="detail-cover-img"
                      draggable={false}
                    />
                  ) : (
                    <div className="franchise-poster-fallback">
                      <Film size={32} aria-hidden="true" />
                    </div>
                  )}
                  {scored && <span className="movie-card-score franchise-score-badge" aria-hidden="true">{entry.total}</span>}
                </div>

                <div className="franchise-card-meta" aria-hidden="true">
                  <p className="franchise-card-title" title={title}>{title}</p>
                  <p className="franchise-card-year">{isCurrent ? 'This film' : year ?? ''}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
