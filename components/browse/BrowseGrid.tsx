'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { usePathname } from 'next/navigation';
import MoodPicker from '@/components/browse/MoodPicker';
import WatchHistoryRow from '@/components/stream/WatchHistoryRow';
import WatchlistButton from '@/components/watchlist/WatchlistButton';
import OptionWheel from '@/components/browse/OptionWheel';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

// Horror sub-genre labels
const GENRE_ITEMS = [
  'All',
  'Slasher',
  'Supernatural',
  'Zombie',
  'Vampire',
  'Haunted House',
  'Found Footage',
  'Paranormal',
  'Psychological',
  'Creature Feature',
  'Gothic Horror',
  'Body Horror',
  'Cult Classic',
  'Survival Horror',
];

interface GenreFilter {
  type: 'keyword' | 'query';
  value: string;
}

const GENRE_FILTER_MAP: Record<string, GenreFilter> = {
  'Slasher':          { type: 'keyword', value: '10339'  },
  'Supernatural':     { type: 'keyword', value: '9663'   },
  'Zombie':           { type: 'keyword', value: '12377'  },
  'Vampire':          { type: 'keyword', value: '5613'   },
  'Haunted House':    { type: 'keyword', value: '10283'  },
  'Found Footage':    { type: 'keyword', value: '14301'  },
  'Body Horror':      { type: 'keyword', value: '10654'  },
  'Gothic Horror':    { type: 'keyword', value: '4344'   },
  'Creature Feature': { type: 'keyword', value: '162086' },
  'Cult Classic':     { type: 'keyword', value: '4379'   },
  'Survival Horror':  { type: 'keyword', value: '10629'  },
  'Psychological':    { type: 'keyword', value: '10890'  },
  'Paranormal':       { type: 'keyword', value: '5480|9663' },
};

// ── In-Memory Page Cache (Client-side anti-abuse & zero-latency navigation) ──
interface CacheEntry {
  results: TmdbDiscoverMovie[];
  totalPages: number;
  timestamp: number;
}
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const pageCache = new Map<string, CacheEntry>();

function getCacheKey(type: string, query: string, genre: string | null, page: number): string {
  return `${type}:${query.trim().toLowerCase()}:${genre ?? 'all'}:${page}`;
}

interface BrowseGridProps {
  canSave?: boolean;
}

export default function BrowseGrid({ canSave = false }: BrowseGridProps) {
  const pathname = usePathname();
  const [movies, setMovies]           = useState<TmdbDiscoverMovie[]>([]);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [mediaType, setMediaType]     = useState<'movie' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [swappingGenre, setSwappingGenre] = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [retryToken, setRetryToken]   = useState(0);

  // Concurrency & rate control refs
  const sentinelRef           = useRef<HTMLDivElement | null>(null);
  const isFetchingRef         = useRef(false);
  const lastFetchTimeRef      = useRef(0);
  const errorCountRef         = useRef(0);
  const activeAbortCtrlRef    = useRef<AbortController | null>(null);
  const genreDebounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveQuery(searchQuery);
      setPage(1);
      setHasMore(true);
      setFetchError(null);
      errorCountRef.current = 0;
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Clean up timers & pending requests on unmount
  useEffect(() => {
    return () => {
      if (genreDebounceRef.current) clearTimeout(genreDebounceRef.current);
      activeAbortCtrlRef.current?.abort();
    };
  }, []);

  // Main Data Fetching Engine
  useEffect(() => {
    let active = true;

    // Abort previous in-flight request on new query/filter/page change
    activeAbortCtrlRef.current?.abort();
    const controller = new AbortController();
    activeAbortCtrlRef.current = controller;

    const cacheKey = getCacheKey(mediaType, activeQuery, genreFilter, page);
    const cached = pageCache.get(cacheKey);
    const now = Date.now();

    // Check in-memory client cache first
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      if (page === 1) {
        setMovies(cached.results);
      } else {
        setMovies(prev => {
          const seen = new Set(prev.map(m => m.id));
          const unique = cached.results.filter(m => !seen.has(m.id));
          return [...prev, ...unique];
        });
      }
      setHasMore(cached.results.length > 0 && page < cached.totalPages);
      setLoading(false);
      setLoadingMore(false);
      setSwappingGenre(false);
      setFetchError(null);
      errorCountRef.current = 0;
      isFetchingRef.current = false;
      return;
    }

    const fetchMovies = async () => {
      if (isFetchingRef.current && page > 1) return;
      isFetchingRef.current = true;
      lastFetchTimeRef.current = Date.now();

      try {
        if (page === 1) {
          setLoading(true);
          setMovies([]);
        } else {
          setLoadingMore(true);
        }

        let endpoint: string;
        if (activeQuery) {
          endpoint = `/api/tmdb/search?query=${encodeURIComponent(activeQuery)}&page=${page}&type=${mediaType}`;
        } else if (genreFilter && GENRE_FILTER_MAP[genreFilter]) {
          const f = GENRE_FILTER_MAP[genreFilter];
          endpoint = `/api/tmdb/discover?page=${page}&type=${mediaType}&with_keywords=${f.value}`;
        } else {
          endpoint = `/api/tmdb/discover?page=${page}&type=${mediaType}`;
        }

        const res = await fetch(endpoint, { signal: controller.signal });
        
        if (res.status === 429) {
          throw new Error('RATE_LIMITED');
        }
        if (!res.ok) {
          throw new Error(`FETCH_FAILED_${res.status}`);
        }

        const data = await res.json();
        if (!active) return;

        const newMovies: TmdbDiscoverMovie[] = data.results || [];
        const totalPages: number = Math.min(data.total_pages || 1, 500);

        // Store into client in-memory cache (limit cache size to 300 entries)
        if (pageCache.size > 300) {
          const firstKey = pageCache.keys().next().value;
          if (firstKey) pageCache.delete(firstKey);
        }
        pageCache.set(cacheKey, {
          results: newMovies,
          totalPages,
          timestamp: Date.now(),
        });

        // Deduplicate movies by ID
        setMovies(prev => {
          if (page === 1) return newMovies;
          const seen = new Set(prev.map(m => m.id));
          const unique = newMovies.filter(m => !seen.has(m.id));
          return [...prev, ...unique];
        });

        const canLoadMore = newMovies.length > 0 && page < totalPages;
        setHasMore(canLoadMore);
        setFetchError(null);
        errorCountRef.current = 0;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (!active) return;
        
        errorCountRef.current += 1;
        if (err?.message === 'RATE_LIMITED') {
          setFetchError('Rate limit reached. Please wait a moment before scrolling.');
        } else if (errorCountRef.current >= 3) {
          setFetchError('Unable to load more titles. Check your connection or tap below to retry.');
        }
      } finally {
        if (active) {
          isFetchingRef.current = false;
          setLoading(false);
          setLoadingMore(false);
          setSwappingGenre(false);
        }
      }
    };

    fetchMovies();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, mediaType, activeQuery, genreFilter, retryToken]);

  // Robust IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;
        
        // Anti-abuse & concurrency guards
        if (isFetchingRef.current) return;
        if (!hasMore || loading || loadingMore) return;
        if (errorCountRef.current >= 3) return; // Circuit breaker active

        // Throttle rapid trigger events (minimum 350ms between page requests)
        const now = Date.now();
        if (now - lastFetchTimeRef.current < 350) return;

        setPage(p => p + 1);
      },
      {
        rootMargin: '400px', // Pre-fetch before user hits the absolute bottom
        threshold: 0.05,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  const handleTabChange = (type: 'movie' | 'tv') => {
    if (type !== mediaType) {
      setMediaType(type);
      setPage(1);
      setHasMore(true);
      setFetchError(null);
      errorCountRef.current = 0;
    }
  };

  const handleGenreChange = (_index: number, item: string) => {
    if (genreDebounceRef.current) clearTimeout(genreDebounceRef.current);
    genreDebounceRef.current = setTimeout(() => {
      setGenreFilter(item === 'All' ? null : item);
      setPage(1);
      setHasMore(true);
      setSwappingGenre(true);
      setFetchError(null);
      errorCountRef.current = 0;
    }, 200);
  };

  const handleRetry = useCallback(() => {
    errorCountRef.current = 0;
    setFetchError(null);
    setRetryToken(t => t + 1);
  }, []);

  return (
    <div className="browse-layout">
      {/* ── Genre Wheel Rail — left sidebar ── */}
      <aside className="browse-genre-rail" aria-label="Filter by genre">
        <OptionWheel
          items={GENRE_ITEMS}
          defaultSelected={0}
          side="left"
          fontSize={1.55}
          spacing={1.35}
          inset={20}
          curve={0.9}
          tilt={7}
          blur={1.5}
          fade={0.28}
          minOpacity={0.06}
          smoothing={180}
          activeColor="#e63232"
          textColor="rgba(255,255,255,0.38)"
          loop={false}
          draggable
          soundUrl=""
          onSettle={handleGenreChange}
        />
        {/* Active label indicator below wheel */}
        <div className="browse-genre-active-label">
          {genreFilter ?? 'All'}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="browse-container browse-container--inset">
        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="browse-header-container">
            <h1 style={{ fontSize: 32, fontWeight: 'bold', margin: 0, color: '#fff' }}>
              Discover Horror
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 8, marginBottom: 0 }}>
              {genreFilter
                ? `Browsing ${genreFilter} — scroll the wheel to switch.`
                : 'Explore the deepest corners of the horror catalog.'}
            </p>
          </div>

          {/* Pick Up Where You Left Off */}
          <WatchHistoryRow />

          {/* Mood Picker */}
          <MoodPicker />

          {/* Search & Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="browse-header-container">
            {/* Media Type Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8, width: 'fit-content' }}>
              {(['movie', 'tv'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => handleTabChange(type)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    background: mediaType === type ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: mediaType === type ? '#fff' : 'rgba(255,255,255,0.5)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {type === 'movie' ? 'Movies' : 'TV Shows'}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="search-input-wrap" style={{ maxWidth: '400px', width: '100%' }}>
              <Search className="search-icon" size={16} style={{ color: 'rgba(255,255,255,0.4)', left: '14px' }} />
              <input
                type="text"
                className="form-input search-input-inner"
                placeholder={mediaType === 'movie' ? 'Search horror / thriller movies...' : 'Search horror / thriller / sci-fi shows...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px', height: '42px', fontSize: '14px', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Initial Loading Skeleton */}
        {loading && page === 1 ? (
          <div className="browse-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ width: '100%', aspectRatio: '2/3', animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              {swappingGenre && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    zIndex: 5,
                    pointerEvents: 'none',
                    transition: 'opacity 180ms ease',
                    borderRadius: 4,
                  }}
                />
              )}

              {/* Movie Grid */}
              <div className="browse-grid">
                {movies.map((movie, idx) => (
                  <Link
                    key={`${movie.id}-${idx}`}
                    href={`/stream/tmdb/${movie.id}?type=${mediaType}&from=${encodeURIComponent(pathname)}`}
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

                      {canSave && (
                        <WatchlistButton
                          tmdbId={movie.id}
                          mediaType={mediaType}
                          title={movie.title ?? movie.name ?? ''}
                          posterUrl={movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null}
                          year={Number((movie.release_date ?? movie.first_air_date ?? '').slice(0, 4)) || null}
                          showLabel={false}
                          className="watchlist-card-overlay-btn"
                        />
                      )}

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
            </div>

            {/* Empty State */}
            {movies.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 15 }}>
                  No items match{searchQuery ? ` "${searchQuery}"` : genreFilter ? ` "${genreFilter}"` : ''}.
                </p>
                {(searchQuery || genreFilter) && (
                  <button
                    className="btn-edit"
                    onClick={() => { setSearchQuery(''); setGenreFilter(null); }}
                    style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Circuit Breaker Error State */}
            {fetchError && (
              <div className="browse-error-banner" role="alert">
                <AlertCircle size={20} color="#e63232" />
                <p style={{ margin: 0 }}>{fetchError}</p>
                <button
                  className="btn-edit"
                  onClick={handleRetry}
                  style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
              </div>
            )}

            {/* Infinite Scroll Dynamic Status & Sentinel */}
            {hasMore && movies.length > 0 && !fetchError && (
              <div className="browse-infinite-status">
                {loadingMore ? (
                  <>
                    <div className="browse-infinite-spinner" aria-hidden="true" />
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: 1 }}>Loading more films...</span>
                  </>
                ) : (
                  <div style={{ height: 24 }} />
                )}
                {/* Sentinel element observed by IntersectionObserver */}
                <div ref={sentinelRef} style={{ height: 10, width: '100%', pointerEvents: 'none' }} aria-hidden="true" />
              </div>
            )}

            {/* End of Catalog Marker */}
            {!hasMore && movies.length > 0 && !fetchError && (
              <div className="browse-end-marker" aria-label="End of catalog reached">
                <div className="browse-end-line" />
                <span>You&apos;ve reached the end</span>
                <div className="browse-end-line" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
