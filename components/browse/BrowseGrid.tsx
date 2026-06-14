'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Search } from 'lucide-react';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

export default function BrowseGrid() {
  const [movies, setMovies] = useState<TmdbDiscoverMovie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  // Debounce search query and reset page in sync
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveQuery(searchQuery);
      setPage(1);
      setHasMore(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;

    const fetchMovies = async () => {
      try {
        if (page === 1) {
          setLoading(true);
          setMovies([]); // Clear list on new search/tab
        } else {
          setLoadingMore(true);
        }

        const endpoint = activeQuery
          ? `/api/tmdb/search?query=${encodeURIComponent(activeQuery)}&page=${page}&type=${mediaType}`
          : `/api/tmdb/discover?page=${page}&type=${mediaType}`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        if (!active) return;

        const newMovies = data.results || [];
        
        if (newMovies.length === 0) {
          setHasMore(false);
        } else {
          setMovies(prev => page === 1 ? newMovies : [...prev, ...newMovies]);
          // If the total pages returned is equal or less than current page, set hasMore false
          if (data.total_pages && page >= data.total_pages) {
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    fetchMovies();

    return () => {
      active = false;
    };
  }, [page, mediaType, activeQuery]);

  const handleTabChange = (type: 'movie' | 'tv') => {
    if (type !== mediaType) {
      setMediaType(type);
      setPage(1);
      setHasMore(true);
    }
  };

  return (
    <div className="browse-container">
      {/* Search and Navigation Header */}
      <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="browse-header-container">
          <h1 style={{ fontSize: 32, fontWeight: 'bold', margin: 0, color: '#fff' }}>
            Discover Horror
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 8, marginBottom: 0 }}>
            Explore the deepest corners of the horror catalog.
          </p>
        </div>

        {/* Search & Filters Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="browse-header-container">
          {/* Media Type Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8, width: 'fit-content' }}>
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

          {/* Global Search Bar */}
          <div className="search-input-wrap" style={{ maxWidth: '400px', width: '100%' }}>
            <Search className="search-icon" size={16} style={{ color: 'rgba(255,255,255,0.4)', left: '14px' }} />
            <input
              type="text"
              className="form-input search-input-inner"
              placeholder={mediaType === 'movie' ? 'Search horror / thriller movies...' : 'Search horror / thriller / sci-fi shows...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '40px',
                height: '42px',
                fontSize: '14px',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      </div>

      {loading && page === 1 ? (
        <div className="browse-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ width: '100%', aspectRatio: '2/3', animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
      ) : (
        <>
          <div className="browse-grid">
            {movies.map((movie, idx) => (
              <Link
                key={`${movie.id}-${idx}`}
                href={`/stream/tmdb/${movie.id}?type=${mediaType}`}
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
                      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 160px"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg=="
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

          {movies.length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', padding: '60px 0' }}>
              No items match your search.
            </div>
          )}

          {hasMore && movies.length > 0 && (
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
