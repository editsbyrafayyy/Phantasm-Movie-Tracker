'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

interface Props {
  label:  string;
  movies: TmdbDiscoverMovie[];
}

export default function TmdbRow({ label, movies }: Props) {
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
  }, [movies, updateScrollState]);

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

  // Mouse wheel horizontal translation
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
      updateScrollState();
    }
  };

  if (!movies.length) return null;

  return (
    <section className="category-section" style={{ position: 'relative', marginBottom: 16 }}>
      <div className="category-header">
        <div className="category-header-title-group">
          <h2 className="category-heading">{label}</h2>
          <span className="category-count">{movies.length} title{movies.length > 1 ? 's' : ''}</span>
        </div>

        {movies.length > 3 && (
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
          onWheel={handleWheel}
        >
          {movies.slice(0, 20).map(movie => (
            <Link
              key={movie.id}
              href={`/stream/tmdb/${movie.id}?from=${encodeURIComponent(pathname)}`}
              className="stream-card group"
              style={{ textDecoration: 'none', display: 'block', position: 'relative' }}
              onMouseEnter={() => router.prefetch(`/stream/tmdb/${movie.id}?from=${encodeURIComponent(pathname)}`)}
              onClick={(e) => {
                if (hasDragged.current) {
                  e.preventDefault();
                  hasDragged.current = false;
                }
              }}
              draggable={false}
            >
              <div className="stream-card-poster">
                {movie.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                    alt={movie.title || movie.name || 'Unknown'}
                    fill
                    className="stream-card-poster-img"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 160px"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg=="
                    draggable={false}
                  />
                ) : (
                  <div style={{
                    height: '100%',
                    background: '#111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>No Image</span>
                  </div>
                )}
                <div className="stream-card-overlay" />

                {/* View overlay */}
                <div className="stream-card-play-btn">
                  <div className="stream-card-play-circle" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <Eye size={16} color="white" />
                  </div>
                </div>
              </div>

              <p className="stream-card-title" style={{ color: '#fff', marginTop: 8 }}>{movie.title || movie.name}</p>
              {(movie.release_date || movie.first_air_date) && (
                <p className="stream-card-year" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  {(movie.release_date || movie.first_air_date)?.slice(0, 4)} • Movie
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
