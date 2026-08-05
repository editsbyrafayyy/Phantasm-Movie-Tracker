'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecentlyViewedItem {
  id: string;
  title: string;
  poster_url: string | null;
  year: number | null;
  total: number | null;
  viewedAt: number;
}

export default function RecentlyViewedRow() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storageKey = 'vault_recently_viewed';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  if (!items.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="category-section" style={{ position: 'relative', marginTop: 32, marginBottom: 32 }}>
      <div className="category-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} style={{ color: 'var(--red)' }} />
          <h2 className="category-heading" style={{ margin: 0 }}>Recently Viewed</h2>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {items.length} title{items.length > 1 ? 's' : ''}
        </span>
      </div>

      {items.length > 3 && (
        <>
          <button
            className="category-scroll-btn left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <ChevronLeft size={24} />
          </button>

          <button
            className="category-scroll-btn right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div className="category-scroll-track" ref={scrollRef}>
        {items.map(item => (
          <motion.div
            key={item.id}
            className="stream-card"
            whileHover={{ scale: 1.04, y: -5 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <Link
              href={`/vault/${item.id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className="stream-card-poster">
                {item.poster_url ? (
                  <Image
                    src={item.poster_url}
                    alt={item.title}
                    fill
                    className="stream-card-poster-img"
                    sizes="(max-width: 640px) 33vw, 160px"
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
                    <Film size={24} color="rgba(255,255,255,0.2)" />
                  </div>
                )}

                <div className="stream-card-overlay" />

                {/* Eye icon overlay */}
                <div className="stream-card-play-btn">
                  <div
                    className="stream-card-play-circle"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <Eye size={16} color="white" />
                  </div>
                </div>

                {/* Rating score badge */}
                {item.total !== null && item.total > 0 && (
                  <span
                    className="movie-card-score"
                    style={{
                      top: 8,
                      right: 8,
                      bottom: 'auto',
                      background: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    +{item.total}
                  </span>
                )}
              </div>

              <p className="stream-card-title" style={{ color: '#fff', marginTop: 8 }}>
                {item.title}
              </p>
              {item.year && (
                <p className="stream-card-year" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  {item.year}
                </p>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
