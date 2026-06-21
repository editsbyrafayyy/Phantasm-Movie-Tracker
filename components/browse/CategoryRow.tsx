'use client';

import { useRef } from 'react';
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

  if (entries.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="category-section" style={{ position: 'relative' }}>
      {label && (
        <div className="category-header">
          <h2 className="category-heading">{label}</h2>
        </div>
      )}
      
      <button className="category-scroll-btn left" onClick={() => scroll('left')} aria-label="Scroll left" style={{ minWidth: 44, minHeight: 44 }}>
        <ChevronLeft size={24} />
      </button>

      <button className="category-scroll-btn right" onClick={() => scroll('right')} aria-label="Scroll right" style={{ minWidth: 44, minHeight: 44 }}>
        <ChevronRight size={24} />
      </button>

      <div className="category-scroll-track" ref={scrollRef}>
        {entries.map(entry => {
          const { movie } = entry;
          const img      = movie.poster_url ?? movie.backdrop_url ?? null;
          const genreHex = SUBGENRE_HEX[entry.subgenre] ?? '#333333';

          return (
            <motion.div
              key={entry.id}
              className="stream-card"
              whileHover={{ scale: 1.04, y: -5 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onMouseEnter={() => router.prefetch(`/vault/${entry.id}?from=${encodeURIComponent(pathname)}`)}
            >
              <Link href={`/vault/${entry.id}?from=${encodeURIComponent(pathname)}`} style={{ textDecoration: 'none', display: 'block' }}>
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
                      style={{ top: 8, right: 8, bottom: 'auto', background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.1)' }}
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
    </section>
  );
}
