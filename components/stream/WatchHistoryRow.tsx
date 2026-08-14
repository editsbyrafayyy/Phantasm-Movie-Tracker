'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export interface HistoryEntry {
  id: string;
  title: string;
  poster_url: string | null;
  type: string;
  watchedAt: number;
  progress?: number; // 0-100 percentage or 0-1 ratio
  currentTime?: number;
  duration?: number;
  completed?: boolean;
}

const HISTORY_KEY = 'vault_watch_history';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export default function WatchHistoryRow() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const all: HistoryEntry[] = JSON.parse(raw);
      const now = Date.now();

      // Check if a film/show has been completed (>= 90% watched)
      const isMovieCompleted = (e: HistoryEntry) => {
        if (e.completed) return true;

        // Progress percentage check (90%+)
        if (typeof e.progress === 'number') {
          if (e.progress >= 90) return true;
          if (e.progress <= 1 && e.progress >= 0.9) return true;
        }

        // Time ratio check (90%+)
        if (e.currentTime && e.duration && e.duration > 0) {
          if ((e.currentTime / e.duration) >= 0.9) return true;
        }

        // TV show episode tracking check (90%+ of episodes checked)
        if (e.type === 'tv') {
          try {
            const stored = localStorage.getItem(`watched:${e.id}`);
            if (stored) {
              const epObj: Record<string, boolean> = JSON.parse(stored);
              const epKeys = Object.keys(epObj);
              const watchedCount = epKeys.filter(k => epObj[k]).length;
              if (epKeys.length > 0 && (watchedCount / epKeys.length) >= 0.9) {
                return true;
              }
            }
          } catch { /* ignore */ }
        }

        return false;
      };

      // Filter stale (>30d) AND exclude movies >= 90% watched
      const uncompleted = all.filter(e => (now - e.watchedAt) < TTL_MS && !isMovieCompleted(e));
      setItems(uncompleted);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [items]);

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    setItems([]);
  }

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  if (items.length === 0) return null;

  return (
    <section className="watch-history-section">
      <div className="watch-history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="watch-history-label">Pick Up Where You Left Off</span>
          <span className="watch-history-count">{items.length} in progress</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {items.length > 3 && (
            <div className="watch-history-nav-btns">
              <button
                type="button"
                className="watch-history-nav-btn"
                onClick={() => scrollByAmount('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                className="watch-history-nav-btn"
                onClick={() => scrollByAmount('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          <button className="watch-history-clear" onClick={clearHistory} aria-label="Clear watch history">
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      <div
        className="watch-history-row"
        ref={scrollRef}
        onScroll={updateScrollState}
      >
        {items.map(item => {
          // Normalize progress percentage (0-100) if available
          let progressPct: number | null = null;
          if (typeof item.progress === 'number' && item.progress > 0 && item.progress < 90) {
            progressPct = item.progress <= 1 ? Math.round(item.progress * 100) : Math.round(item.progress);
          } else if (item.currentTime && item.duration && item.duration > 0) {
            const ratio = item.currentTime / item.duration;
            if (ratio > 0 && ratio < 0.9) {
              progressPct = Math.round(ratio * 100);
            }
          }

          return (
            <Link
              key={item.id}
              href={`/stream/${item.id}`}
              className="watch-history-card"
              prefetch={false}
            >
              <div className="watch-history-poster">
                {item.poster_url ? (
                  <Image
                    src={item.poster_url}
                    alt={item.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="110px"
                  />
                ) : (
                  <div className="watch-history-poster-fallback">
                    {item.title.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="watch-history-play-overlay">
                  <Play size={18} fill="white" color="white" />
                </div>

                {/* Progress bar at bottom of poster if partially watched */}
                {progressPct !== null && (
                  <div className="watch-history-progress-track">
                    <div
                      className="watch-history-progress-fill"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
              <p className="watch-history-title" title={item.title}>{item.title}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
