'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, Clock, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';

interface RecentlyViewedItem {
  id: string;
  title: string;
  poster_url: string | null;
  year: number | null;
  total: number | null;
  viewedAt: number;
}

const STORAGE_KEY = 'vault_recently_viewed';

export default function RecentlyViewedRow() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
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
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [items]);

  const clearRecentlyViewed = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setItems([]);
    } catch {
      /* ignore */
    }
  };

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  if (!items.length) return null;

  return (
    <section className="recently-viewed-section" aria-label="Recently Viewed">
      <div className="recently-viewed-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={13} style={{ color: 'var(--red)' }} />
          <span className="recently-viewed-label">RECENTLY VIEWED</span>
          <span className="recently-viewed-count">{items.length} titles</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {items.length > 4 && (
            <div className="recently-viewed-nav-btns">
              <button
                type="button"
                className="recently-viewed-nav-btn"
                onClick={() => scrollByAmount('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                className="recently-viewed-nav-btn"
                onClick={() => scrollByAmount('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button
            type="button"
            className="recently-viewed-clear"
            onClick={clearRecentlyViewed}
            aria-label="Clear recently viewed history"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      <div
        className="recently-viewed-row"
        ref={scrollRef}
        onScroll={updateScrollState}
      >
        {items.map(item => (
          <Link
            key={item.id}
            href={`/vault/${item.id}`}
            className="recently-viewed-card"
          >
            <div className="recently-viewed-poster">
              {item.poster_url ? (
                <Image
                  src={item.poster_url}
                  alt={item.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 90px, 110px"
                />
              ) : (
                <div
                  style={{
                    height: '100%',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Film size={22} color="rgba(255,255,255,0.2)" />
                </div>
              )}

              {/* Eye hover overlay */}
              <div className="recently-viewed-eye-overlay">
                <Eye size={18} color="white" />
              </div>

              {/* Rating score badge */}
              {item.total !== null && item.total > 0 && (
                <span className="recently-viewed-score">
                  +{item.total}
                </span>
              )}
            </div>

            <p className="recently-viewed-title" title={item.title}>
              {item.title}
            </p>
            {item.year && (
              <p className="recently-viewed-year">
                {item.year}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
