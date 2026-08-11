'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import MoodPicker from '@/components/browse/MoodPicker';
import WatchlistButton from '@/components/watchlist/WatchlistButton';
import OptionWheel from '@/components/browse/OptionWheel';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

// Horror sub-genre labels → TMDB genre keyword IDs (used as `with_keywords` param)
// "All" resets the filter; others narrow discovery to that horror flavour
const GENRE_ITEMS = [
  'All',
  'Slasher',
  'Supernatural',
  'Psychological',
  'Found Footage',
  'Body Horror',
  'Survival Horror',
  'Paranormal',
  'Creature Feature',
  'Gothic Horror',
  'Cosmic Horror',
  'Zombie',
  'Vampire',
  'Haunted House',
  'Cult Classic',
];

// Maps label → TMDB keyword ID string (comma-separated if needed)
// These are real TMDB keyword IDs for horror sub-genres
const GENRE_KEYWORD_MAP: Record<string, string> = {
  'Slasher':         '10339',
  'Supernatural':    '9663',
  'Psychological':   '9951',
  'Found Footage':   '207166',
  'Body Horror':     '166090',
  'Survival Horror': '180547',
  'Paranormal':      '9717',
  'Creature Feature':'163376',
  'Gothic Horror':   '11804',
  'Cosmic Horror':   '282898',
  'Zombie':          '12377',
  'Vampire':         '5613',
  'Haunted House':   '10283',
  'Cult Classic':    '4379',
};

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
  // null = "All" (no filter), string = active genre label
  const [genreFilter, setGenreFilter] = useState<string | null>(null);

  // Debounce search
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
          setMovies([]);
        } else {
          setLoadingMore(true);
        }

        let endpoint: string;
        if (activeQuery) {
          endpoint = `/api/tmdb/search?query=${encodeURIComponent(activeQuery)}&page=${page}&type=${mediaType}`;
        } else {
          const kwParam = genreFilter && GENRE_KEYWORD_MAP[genreFilter]
            ? `&with_keywords=${GENRE_KEYWORD_MAP[genreFilter]}`
            : '';
          endpoint = `/api/tmdb/discover?page=${page}&type=${mediaType}${kwParam}`;
        }

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();
        if (!active) return;

        const newMovies = data.results || [];
        if (newMovies.length === 0) {
          setHasMore(false);
        } else {
          setMovies(prev => page === 1 ? newMovies : [...prev, ...newMovies]);
          if (data.total_pages && page >= data.total_pages) setHasMore(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) { setLoading(false); setLoadingMore(false); }
      }
    };

    fetchMovies();
    return () => { active = false; };
  }, [page, mediaType, activeQuery, genreFilter]);

  const handleTabChange = (type: 'movie' | 'tv') => {
    if (type !== mediaType) {
      setMediaType(type);
      setPage(1);
      setHasMore(true);
    }
  };

  const handleGenreChange = (_index: number, item: string) => {
    const newFilter = item === 'All' ? null : item;
    setGenreFilter(newFilter);
    setPage(1);
    setHasMore(true);
  };

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
          onChange={handleGenreChange}
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

        {/* Grid */}
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

            {movies.length === 0 && (
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
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
