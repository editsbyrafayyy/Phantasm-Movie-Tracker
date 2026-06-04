'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

interface Props {
  label:  string;
  movies: TmdbDiscoverMovie[];
}

export default function TmdbRow({ label, movies }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!movies.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="category-section" style={{ position: 'relative' }}>
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
            className="stream-card"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div className="stream-card-poster">
              {movie.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                  alt={movie.title}
                  fill
                  className="stream-card-poster-img"
                  unoptimized
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
              {movie.vote_average > 0 && (
                <div className="stream-card-imdb">
                  <Star size={9} fill="currentColor" style={{ display: 'inline' }} />
                  {' '}{movie.vote_average.toFixed(1)}
                </div>
              )}
            </div>
            <p className="stream-card-title">{movie.title}</p>
            {movie.release_date && (
              <p className="stream-card-year">{movie.release_date.slice(0, 4)}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
