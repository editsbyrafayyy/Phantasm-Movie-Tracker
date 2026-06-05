'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

export default function BrowseGrid() {
  const [movies, setMovies] = useState<TmdbDiscoverMovie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');

  const fetchMovies = async (pageNum: number, type: 'movie' | 'tv') => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(`/api/tmdb/discover?page=${pageNum}&type=${type}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      const newMovies = data.results || [];
      
      if (newMovies.length === 0) {
        setHasMore(false);
      } else {
        setMovies(prev => pageNum === 1 ? newMovies : [...prev, ...newMovies]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMovies(page, mediaType);
  }, [page, mediaType]);

  const handleTabChange = (type: 'movie' | 'tv') => {
    if (type !== mediaType) {
      setMediaType(type);
      setPage(1);
      setHasMore(true);
    }
  };

  return (
    <div style={{ padding: '40px', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', margin: 0, color: '#fff' }}>Discover Horror</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Explore the deepest corners of the horror catalog.</p>
        </div>

        {/* Media Type Tabs */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8 }}>
          <button
            onClick={() => handleTabChange('movie')}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              background: mediaType === 'movie' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: mediaType === 'movie' ? '#fff' : 'rgba(255,255,255,0.5)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Movies
          </button>
          <button
            onClick={() => handleTabChange('tv')}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              background: mediaType === 'tv' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: mediaType === 'tv' ? '#fff' : 'rgba(255,255,255,0.5)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            TV Shows
          </button>
        </div>
      </div>

      {loading && page === 1 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px 16px' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ width: '100%', aspectRatio: '2/3', background: 'rgba(255,255,255,0.05)', borderRadius: 8, animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px 16px' }}>
            {movies.map((movie, idx) => (
              <Link
                key={`${movie.id}-${idx}`}
                href={`/stream/${movie.id}?type=${mediaType}`}
                className="stream-card group"
                style={{ textDecoration: 'none', display: 'block', position: 'relative' }}
              >
                <div className="stream-card-poster" style={{ height: 'auto', aspectRatio: '2/3' }}>
                  {movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                      alt={movie.title || movie.name || 'Unknown'}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  ) : (
                    <div style={{ height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    {(movie.release_date || movie.first_air_date)?.slice(0, 4)} • {mediaType === 'movie' ? 'Movie' : 'TV Show'}
                  </p>
                )}
              </Link>
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 48, marginBottom: 40 }}>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loadingMore}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  opacity: loadingMore ? 0.7 : 1,
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
