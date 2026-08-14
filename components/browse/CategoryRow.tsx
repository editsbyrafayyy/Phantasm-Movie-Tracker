'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Film, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SUBGENRE_HEX } from '@/lib/config';
import type { Entry } from '@/lib/types';

interface CategoryRowProps {
  label:   string;
  entries: Entry[];
}

export default function CategoryRow({ label, entries }: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [entries, updateScrollState]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  // Mouse drag-to-scroll
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
    const walk = (x - dragStartX.current) * 1.4;
    if (Math.abs(walk) > 4) {
      hasDragged.current = true;
    }
    el.scrollLeft = dragStartScrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  if (entries.length === 0) return null;

  return (
    <section className="category-section" style={{ position: 'relative' }}>
      <div className="category-header">
        <div className="category-header-title-group">
          {label && <h2 className="category-heading">{label}</h2>}
          <span className="category-count">{entries.length} film{entries.length > 1 ? 's' : ''}</span>
        </div>

        {entries.length > 3 && (
          <div className="category-nav-btns">
            <button
              type="button"
              className="category-nav-btn"
              onClick={() => scrollByAmount('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="category-nav-btn"
              onClick={() => scrollByAmount('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Carousel Wrapper with Dynamic Edge Gradient Masks */}
      <div className={`category-carousel-wrapper${canScrollLeft ? ' has-left-fade' : ''}${canScrollRight ? ' has-right-fade' : ''}`}>
        <div
          className={`category-scroll-track${isDragging ? ' is-dragging' : ''}`}
          ref={scrollRef}
          onScroll={updateScrollState}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {entries.map(entry => {
            const { movie } = entry;
            const img      = movie.poster_url ?? movie.backdrop_url ?? null;
            const genreHex = SUBGENRE_HEX[entry.subgenre] ?? '#333333';

            return (
              <motion.div
                key={entry.id}
                className="stream-card"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                onMouseEnter={() => router.prefetch(`/vault/${entry.id}?from=${encodeURIComponent(pathname)}`)}
              >
                <Link
                  href={`/vault/${entry.id}?from=${encodeURIComponent(pathname)}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                  onClick={(e) => {
                    if (hasDragged.current) {
                      e.preventDefault();
                      hasDragged.current = false;
                    }
                  }}
                  draggable={false}
                >
                  <div className="stream-card-poster">
                    {img ? (
                      <Image
                        src={img}
                        alt={movie.title}
                        fill
                        className="stream-card-poster-img"
                        sizes="(max-width: 640px) 33vw, 160px"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg=="
                        draggable={false}
                      />
                    ) : (
                      <div style={{
                        height: '100%',
                        background: `linear-gradient(160deg, #111 0%, ${genreHex}22 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Film size={24} color="rgba(255,255,255,0.12)" />
                      </div>
                    )}

                    <div className="stream-card-overlay" />

                    {/* View overlay */}
                    <div className="stream-card-play-btn">
                      <div className="stream-card-play-circle" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                        <Eye size={16} color="white" />
                      </div>
                    </div>

                    {/* Vault score */}
                    {entry.total !== null && entry.total > 0 && (
                      <span
                        className="movie-card-score"
                        style={{ top: 8, right: 8, bottom: 'auto', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        +{entry.total}
                      </span>
                    )}
                  </div>

                  <p className="stream-card-title" style={{ color: '#fff', marginTop: 8 }}>{movie.title}</p>
                  {movie.year && <p className="stream-card-year" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{movie.year} • {movie.runtime_min ? `${movie.runtime_min}min` : 'Movie'}</p>}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
