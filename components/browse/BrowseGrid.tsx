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
  'Psychological',
  'Supernatural & Ghosts',
  'Occult & Demonic',
  'Folk Horror',
  'Creature Feature',
  'Zombie',
  'Vampire',
  'Found Footage',
  'Body Horror',
  'Gothic Horror',
  'Survival Horror',
  'Sci-Fi Horror',
  'Horror Comedy',
  'Gore & Extreme',
  'Haunted House',
  'Cult Classic',
];

interface GenreFilterConfig {
  genres?: string;
  keywords?: string;
  withoutGenres?: string;
}

const GENRE_FILTER_MAP: Record<string, GenreFilterConfig> = {
  'Slasher': {
    genres: '27',
    keywords: '10339|12339|209714|9748|2626',
  },
  'Psychological': {
    genres: '27|53|9648',
    keywords: '10890|15001|9714|12554|214488|10787',
  },
  'Supernatural & Ghosts': {
    genres: '27',
    keywords: '5480|18035|10283|12552|156212|303334',
  },
  'Occult & Demonic': {
    genres: '27',
    keywords: '6158|2618|18035|303334|1523|10123|12552',
  },
  'Folk Horror': {
    genres: '27',
    keywords: '158718|1599|218579|6158|2618|180495',
  },
  'Creature Feature': {
    genres: '27',
    keywords: '1299|228809|1308|9951|173934|162086|10683',
  },
  'Zombie': {
    genres: '27',
    keywords: '12377|186565|10292|4458',
  },
  'Vampire': {
    genres: '27',
    keywords: '5613|3133',
  },
  'Found Footage': {
    genres: '27',
    keywords: '14301|209715|180497|180498',
  },
  'Body Horror': {
    genres: '27',
    keywords: '10654|180489|180491|180492',
  },
  'Gothic Horror': {
    genres: '27',
    keywords: '4344|180495|10283',
  },
  'Survival Horror': {
    genres: '27|53',
    keywords: '10683|10629|158713|156212|10787|10084',
  },
  'Sci-Fi Horror': {
    genres: '27,878',
    keywords: '9951|4565|180489|1612',
  },
  'Horror Comedy': {
    genres: '27,35',
  },
  'Gore & Extreme': {
    genres: '27',
    keywords: '180493|10654|9748|10714|2306',
  },
  'Haunted House': {
    genres: '27',
    keywords: '10283|12552|18035',
  },
  'Cult Classic': {
    genres: '27|53',
    keywords: '4379|9716|209714',
  },
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
  const [isWheelHovered, setIsWheelHovered] = useState(false);

  // Concurrency, rate control & hover refs
  const sentinelRef           = useRef<HTMLDivElement | null>(null);
  const isFetchingRef         = useRef(false);
  const lastFetchTimeRef      = useRef(0);
  const errorCountRef         = useRef(0);
  const activeAbortCtrlRef    = useRef<AbortController | null>(null);
  const genreDebounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverLeaveTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
      activeAbortCtrlRef.current?.abort();
    };
  }, []);

  const handleWheelMouseEnter = () => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    setIsWheelHovered(true);
  };

  const handleWheelMouseLeave = () => {
    hoverLeaveTimerRef.current = setTimeout(() => {
      setIsWheelHovered(false);
    }, 60);
  };

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
          const params = new URLSearchParams({
            page: String(page),
            type: mediaType,
          });
          if (f.genres) params.set('with_genres', f.genres);
          if (f.keywords) params.set('with_keywords', f.keywords);
          if (f.withoutGenres) params.set('without_genres', f.withoutGenres);
          endpoint = `/api/tmdb/discover?${params.toString()}`;
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
      <aside
        className={`browse-genre-rail ${isWheelHovered ? 'browse-genre-rail--expanded' : ''}`}
        aria-label="Filter by genre"
        aria-expanded={isWheelHovered}
        onMouseEnter={handleWheelMouseEnter}
        onMouseLeave={handleWheelMouseLeave}
      >
        {/* Subtle hint that illuminates when rail is expanded */}
        <div className="browse-genre-rail-hint" aria-hidden="true">
          <span className="browse-genre-rail-hint-dot" />
          <span>Scroll or click subgenres</span>
        </div>

        <OptionWheel
          key={genreFilter ?? 'all'}
          items={GENRE_ITEMS}
          defaultSelected={genreFilter ? GENRE_ITEMS.indexOf(genreFilter) : 0}
          side="left"
          fontSize={isWheelHovered ? 1.85 : 1.45}
          spacing={isWheelHovered ? 1.45 : 1.32}
          inset={isWheelHovered ? 32 : 20}
          curve={isWheelHovered ? 1.05 : 0.9}
          tilt={isWheelHovered ? 8 : 7}
          blur={isWheelHovered ? 0.4 : 1.4}
          fade={isWheelHovered ? 0.16 : 0.28}
          minOpacity={isWheelHovered ? 0.22 : 0.06}
          smoothing={180}
          activeColor="#e63232"
          textColor={isWheelHovered ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.32)'}
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

      {/* ── Screen Vignette Overlay on Hover ── */}
      <div
        className={`browse-vignette-overlay ${isWheelHovered ? 'browse-vignette-overlay--active' : ''}`}
        aria-hidden="true"
      />

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
