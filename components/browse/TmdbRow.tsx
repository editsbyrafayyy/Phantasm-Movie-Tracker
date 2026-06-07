'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

interface Props {
  label:  string;
  movies: TmdbDiscoverMovie[];
}

export default function TmdbRow({ label, movies }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  if (!movies.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="category-section" style={{ position: 'relative', marginBottom: 8 }}>
      <div className="category-header">
        <h2 className="category-heading">{label}</h2>
      </div>

      <button className="category-scroll-btn left" onClick={() => scroll('left')} aria-label="Scroll left" style={{ minWidth: 44, minHeight: 44 }}>
        <ChevronLeft size={24} />
      </button>

      <button className="category-scroll-btn right" onClick={() => scroll('right')} aria-label="Scroll right" style={{ minWidth: 44, minHeight: 44 }}>
        <ChevronRight size={24} />
      </button>

      <div className="category-scroll-track" ref={scrollRef}>
        {movies.slice(0, 20).map(movie => (
          <Link
            key={movie.id}
            href={`/stream/tmdb/${movie.id}`}
            className="stream-card group"
            style={{ textDecoration: 'none', display: 'block', position: 'relative' }}
            onMouseEnter={() => router.prefetch(`/stream/tmdb/${movie.id}`)}
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
    </section>
  );
}
