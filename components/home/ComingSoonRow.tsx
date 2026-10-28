'use client';

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

interface Props {
  films: TmdbDiscoverMovie[];
  /** YYYY-MM-DD, computed on the server. */
  today: string;
  /** Guests get plain cards: the film pages behind them are members-only. */
  linkable?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** "14 Nov" for this calendar year, "Mar 2027" further out. */
function formatRelease(iso: string, today: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const month = MONTHS[(m || 1) - 1];
  return iso.slice(0, 4) === today.slice(0, 4) ? `${d} ${month}` : `${month} ${y}`;
}

// The viewer's local date. The server's (UTC) date is used for SSR/hydration, then
// React swaps in the local one so "in N days" matches the viewer's calendar.
const noSubscribe = () => () => {};
function localToday(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/** "Today" / "Tomorrow" / "in 6 days" for releases under 30 days out, else null. */
function countdown(iso: string, today: string): string | null {
  const days = Math.round((utcDate(iso).getTime() - utcDate(today).getTime()) / DAY_MS);
  if (days < 0 || days >= 30) return null;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

/** A link for members; a plain card for guests (same look, nothing to open). */
function CardShell({ href, label, onClick, children }: {
  href: string | null;
  label: string;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
}) {
  if (!href) {
    return <div className="stream-card-link" role="group" aria-label={label}>{children}</div>;
  }
  return (
    <Link href={href} className="stream-card-link" aria-label={label} onClick={onClick} draggable={false}>
      {children}
    </Link>
  );
}

export default function ComingSoonRow({ films, today: serverToday, linkable = true }: Props) {
  const today = useSyncExternalStore(noSubscribe, localToday, () => serverToday);
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
  }, [films.length, updateScrollState]);

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
    <div className="coming-soon-carousel-container">
      {/* Sub-header navigation row */}
      {films.length > 3 && (
        <div className="category-header coming-soon-nav">
          <div className="category-nav-btns">
            <button
              type="button"
              className="category-nav-btn"
              onClick={() => scrollByAmount('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll coming soon left"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="category-nav-btn"
              onClick={() => scrollByAmount('right')}
              disabled={!canScrollRight}
              aria-label="Scroll coming soon right"
            >
              <ChevronRight size={16} aria-hidden="true" />
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
            if (!film.poster_path) return null;
            const posterUrl = `https://image.tmdb.org/t/p/w342${film.poster_path}`;
            const title = film.title ?? film.name ?? 'Unknown';
            const date = film.release_date ?? '';
            const when = date ? formatRelease(date, today) : null;
            const soon = date ? countdown(date, today) : null;
            const href = `/stream/tmdb/${film.id}?type=movie&from=${encodeURIComponent(pathname)}`;

            return (
              <motion.div
                key={film.id}
                className="stream-card coming-soon-card"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                onMouseEnter={linkable ? () => router.prefetch(href) : undefined}
              >
                <CardShell
                  href={linkable ? href : null}
                  label={`${title}${when ? `, releases ${when}` : ''}`}
                  onClick={(e) => {
                    if (hasDragged.current) {
                      e.preventDefault();
                      hasDragged.current = false;
                    }
                  }}
                >
                  <div className="stream-card-poster">
                    <Image
                      src={posterUrl}
                      alt=""
                      fill
                      sizes="160px"
                      loading="lazy"
                      className="stream-card-poster-img"
                      draggable={false}
                    />
                    <div className="stream-card-overlay" />
                  </div>
                  <p className="stream-card-title category-card-title">{title}</p>
                  {when && (
                    <p className="coming-soon-date">
                      <time dateTime={date}>{when}</time>
                      {soon && <span className="coming-soon-countdown">{soon}</span>}
                    </p>
                  )}
                </CardShell>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
