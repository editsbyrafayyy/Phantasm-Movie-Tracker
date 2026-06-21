'use client';

import { useRef } from 'react';
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
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

      <div className="category-scroll-track" ref={scrollRef}>
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
              whileHover={{ scale: 1.04, y: -5 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onMouseEnter={() => router.prefetch(`/stream/tmdb/${film.id}`)}
              style={{ display: 'block' }}
            >
              <Link
                href={`/stream/tmdb/${film.id}?type=movie&from=${encodeURIComponent(pathname)}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className="stream-card-poster">
                  <Image
                    src={posterUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 33vw, 160px"
                    className="stream-card-poster-img"
                    style={{ objectFit: 'cover' }}
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
    </>
  );
}
