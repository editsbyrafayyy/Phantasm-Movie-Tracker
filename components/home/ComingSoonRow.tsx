'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

interface Props {
  films: TmdbDiscoverMovie[];
}

export default function ComingSoonRow({ films }: Props) {
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
  }, [films, updateScrollState]);

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

  if (!films.length) return null;

  return (
    <div className="coming-soon-carousel-container" style={{ position: 'relative' }}>
      {/* Sub-header navigation row */}
      {films.length > 3 && (
        <div className="category-header" style={{ marginBottom: 12, justifyContent: 'flex-end' }}>
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
        </div>
      )}

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
          {films.map(film => {
            const posterUrl = film.poster_path
              ? `https://image.tmdb.org/t/p/w342${film.poster_path}`
              : null;
            const title = film.title ?? film.name ?? 'Unknown';
            const date = film.release_date ?? film.first_air_date ?? '';
            const year = date.slice(0, 4);
            const month = date.length >= 7
              ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
              : null;

            if (!posterUrl) return null;

            return (
              <motion.div
                key={film.id}
                className="stream-card"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                onMouseEnter={() => router.prefetch(`/stream/tmdb/${film.id}`)}
                style={{ display: 'block' }}
              >
                <Link
                  href={`/stream/tmdb/${film.id}?type=movie&from=${encodeURIComponent(pathname)}`}
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
                    <Image
                      src={posterUrl}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 33vw, 160px"
                      className="stream-card-poster-img"
                      style={{ objectFit: 'cover' }}
                      draggable={false}
                    />
                    <div className="stream-card-overlay" />
                    
                    {month && year && (
                      <span className="otd-year">{month} {year}</span>
                    )}
                  </div>
                  <p className="stream-card-title" style={{ color: '#fff', marginTop: 8 }}>{title}</p>
                  {date && (
                    <p className="stream-card-year" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                      {month} {year} • Coming Soon
                    </p>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
