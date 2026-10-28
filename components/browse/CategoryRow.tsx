'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { gridPosterUrl } from '@/components/vault/posterSrc';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SUBGENRE_HEX } from '@/lib/config';
import type { Entry } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';

interface CategoryRowProps {
  label:   string;
  entries: Entry[];
  /** Curated rows get a full section header (Bebas title + Playfair accent) instead of the small label. */
  heading?:  { title: string; accent?: string; subtitle?: string };
  /** Per-entry caption replacing the year line (keyed by entry id). */
  captions?: Record<string, string>;
}

export default function CategoryRow({ label, entries, heading, captions }: CategoryRowProps) {
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

  // ResizeObserver fires once on observe and again whenever the track resizes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    return () => ro.disconnect();
  }, [entries.length, updateScrollState]);

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

  const nav = entries.length > 3 && (
    <div className="category-nav-btns">
      <button
        type="button"
        className="category-nav-btn"
        onClick={() => scrollByAmount('left')}
        disabled={!canScrollLeft}
        aria-label={`Scroll ${label || 'row'} left`}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="category-nav-btn"
        onClick={() => scrollByAmount('right')}
        disabled={!canScrollRight}
        aria-label={`Scroll ${label || 'row'} right`}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <section className="category-section">
      {heading ? (
        <div className="home-section-head">
          <PageHeader as="section" title={heading.title} accent={heading.accent} subtitle={heading.subtitle} actions={nav} />
        </div>
      ) : (
        <div className="category-header">
          <div className="category-header-title-group">
            {label && <h2 className="category-heading">{label}</h2>}
            <span className="category-count">{entries.length} film{entries.length > 1 ? 's' : ''}</span>
          </div>
          {nav}
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
          {entries.map(entry => {
            const { movie } = entry;
            const img      = gridPosterUrl(movie.poster_url ?? null) ?? movie.backdrop_url ?? null;
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
                  className="stream-card-link"
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
                        alt=""
                        fill
                        className="stream-card-poster-img"
                        sizes="(max-width: 640px) 33vw, 160px"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg=="
                        draggable={false}
                      />
                    ) : (
                      <div
                        className="category-card-fallback"
                        style={{ background: `linear-gradient(160deg, #111 0%, ${genreHex}22 100%)` }}
                      >
                        <Film size={32} aria-hidden="true" />
                      </div>
                    )}

                    <div className="stream-card-overlay" />

                    {/* Vault score */}
                    {entry.total !== null && entry.total > 0 && (
                      <span className="movie-card-score" aria-label={`Score ${entry.total} out of 10`}>
                        {entry.total}
                      </span>
                    )}
                  </div>

                  <p className="stream-card-title category-card-title">{movie.title}</p>
                  {captions?.[entry.id] ? (
                    <p className="stream-card-year category-card-meta">{captions[entry.id]}</p>
                  ) : movie.year && (
                    <p className="stream-card-year category-card-meta">
                      {movie.year}{movie.runtime_min ? ` · ${movie.runtime_min} min` : ''}
                    </p>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
