'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';
import type { GenreFilterConfig } from './browseGenres';

export type MediaType = 'movie' | 'tv';

interface FeedQuery {
  mediaType: MediaType;
  /** Trimmed search text; takes precedence over the genre filter. */
  query:     string;
  genre:     string | null;
}

type FeedStatus = 'loading' | 'loadingMore' | 'ready' | 'error';

interface FeedState {
  /** Query key the visible `movies` belong to (may lag behind while a new query loads). */
  key:       string;
  mediaType: MediaType;
  movies:    TmdbDiscoverMovie[];
  /** Last page successfully loaded into `movies`. */
  page:      number;
  hasMore:   boolean;
  status:    FeedStatus;
  error:     string | null;
}

/** Above this many pages infinite scroll stops and a manual button takes over (protects API quota). */
export const MAX_AUTO_PAGES = 15;
const SEARCH_DEBOUNCE_MS = 400;
const MIN_PAGE_INTERVAL_MS = 350;
const MAX_SOFT_ERRORS = 3;

// ── In-memory page cache (client-side anti-abuse & instant back-navigation) ──
interface CacheEntry { results: TmdbDiscoverMovie[]; totalPages: number; timestamp: number }
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 300;
const pageCache = new Map<string, CacheEntry>();

function keyOf(q: FeedQuery): string {
  return `${q.mediaType}:${q.query.toLowerCase()}:${q.query ? 'all' : q.genre ?? 'all'}`;
}

function readCache(key: string, page: number): CacheEntry | null {
  const hit = pageCache.get(`${key}:${page}`);
  if (!hit) return null;
  if (Date.now() - hit.timestamp >= CACHE_TTL_MS) {
    pageCache.delete(`${key}:${page}`);
    return null;
  }
  return hit;
}

function writeCache(key: string, page: number, results: TmdbDiscoverMovie[], totalPages: number) {
  if (pageCache.size >= CACHE_MAX) {
    const oldest = pageCache.keys().next().value;
    if (oldest) pageCache.delete(oldest);
  }
  pageCache.set(`${key}:${page}`, { results, totalPages, timestamp: Date.now() });
}

function endpointFor(q: FeedQuery, page: number, filterMap: Record<string, GenreFilterConfig>): string {
  if (q.query) {
    return `/api/tmdb/search?query=${encodeURIComponent(q.query)}&page=${page}&type=${q.mediaType}`;
  }
  const params = new URLSearchParams({ page: String(page), type: q.mediaType });
  const f = q.genre ? filterMap[q.genre] : undefined;
  if (f?.genres)        params.set('with_genres', f.genres);
  if (f?.keywords)      params.set('with_keywords', f.keywords);
  if (f?.withoutGenres) params.set('without_genres', f.withoutGenres);
  return `/api/tmdb/discover?${params.toString()}`;
}

/** Merge a fetched/cached page into the feed, de-duplicating by TMDB id. */
function applyPage(
  prev: FeedState, key: string, mediaType: MediaType, page: number,
  results: TmdbDiscoverMovie[], totalPages: number,
): FeedState {
  let movies = results;
  if (page > 1 && prev.key === key) {
    const seen = new Set(prev.movies.map(m => m.id));
    movies = [...prev.movies, ...results.filter(m => !seen.has(m.id))];
  }
  return {
    key, mediaType, movies, page,
    hasMore: results.length > 0 && page < Math.min(totalPages, 500),
    status: 'ready',
    error: null,
  };
}

const INITIAL_QUERY: FeedQuery = { mediaType: 'movie', query: '', genre: null };

function initialFeed(): FeedState {
  const key = keyOf(INITIAL_QUERY);
  const base: FeedState = { key, mediaType: 'movie', movies: [], page: 0, hasMore: true, status: 'loading', error: null };
  const cached = readCache(key, 1);
  return cached ? applyPage(base, key, 'movie', 1, cached.results, cached.totalPages) : base;
}

/**
 * Data layer for the discovery grid: query state (type / search / genre),
 * debounced search, page cache, abortable fetches and infinite scroll.
 */
export function useBrowseFeed(filterMap: Record<string, GenreFilterConfig>) {
  const [mediaType, setMediaTypeState] = useState<MediaType>('movie');
  const [searchQuery, setSearchQueryState] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedState>(initialFeed);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  const abortRef        = useRef<AbortController | null>(null);
  const requestedKeyRef = useRef(keyOf(INITIAL_QUERY));
  const lastFetchRef    = useRef(0);
  const softErrorsRef   = useRef(0);
  const backoffRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Fire the network request. Never sets state synchronously (safe to call from effects). */
  const startFetch = useCallback((q: FeedQuery, page: number) => {
    const key = keyOf(q);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    requestedKeyRef.current = key;
    lastFetchRef.current = Date.now();

    (async () => {
      try {
        const res = await fetch(endpointFor(q, page, filterMap), { signal: controller.signal });
        if (res.status === 429) throw new Error('RATE_LIMITED');
        if (!res.ok) throw new Error(`FETCH_FAILED_${res.status}`);
        const data = await res.json();
        if (controller.signal.aborted) return;

        const results: TmdbDiscoverMovie[] = Array.isArray(data.results) ? data.results : [];
        const totalPages = Math.min(Number(data.total_pages) || 1, 500);
        writeCache(key, page, results, totalPages);
        softErrorsRef.current = 0;
        setFeed(prev => applyPage(prev, key, q.mediaType, page, results, totalPages));
      } catch (err) {
        if (controller.signal.aborted || (err as Error)?.name === 'AbortError') return;
        const rateLimited = (err as Error)?.message === 'RATE_LIMITED';

        if (page === 1) {
          // Nothing trustworthy to show for this query — surface the error immediately.
          setFeed({
            key, mediaType: q.mediaType, movies: [], page: 0, hasMore: false, status: 'error',
            error: rateLimited ? 'Too many requests. Wait a moment and try again.' : 'Couldn’t load titles. Check your connection and try again.',
          });
          return;
        }

        softErrorsRef.current += 1;
        if (rateLimited || softErrorsRef.current >= MAX_SOFT_ERRORS) {
          setFeed(prev => ({
            ...prev, status: 'error',
            error: rateLimited ? 'Rate limit reached. Wait a moment before loading more.' : 'Unable to load more titles. Check your connection and try again.',
          }));
        } else {
          // Back off, then let infinite scroll retry the same page.
          if (backoffRef.current) clearTimeout(backoffRef.current);
          backoffRef.current = setTimeout(() => {
            setFeed(prev => (prev.status === 'loadingMore' ? { ...prev, status: 'ready' } : prev));
          }, 800 * softErrorsRef.current);
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    })();
  }, [filterMap]);

  /** Load `page` of `q`, from cache when possible. Event/callback use only. */
  const load = useCallback((q: FeedQuery, page: number) => {
    const key = keyOf(q);
    if (page === 1) softErrorsRef.current = 0;
    const cached = readCache(key, page);
    if (cached) {
      abortRef.current?.abort();
      requestedKeyRef.current = key;
      setFeed(prev => applyPage(prev, key, q.mediaType, page, cached.results, cached.totalPages));
      return;
    }
    setFeed(prev => ({ ...prev, status: page === 1 ? 'loading' : 'loadingMore', error: null }));
    startFetch(q, page);
  }, [startFetch]);

  // Initial fetch (skipped when the first page came from cache).
  const initialStatusRef = useRef(feed.status);
  useEffect(() => {
    if (initialStatusRef.current === 'loading') startFetch(INITIAL_QUERY, 1);
  }, [startFetch]);

  // Abort in-flight work and timers on unmount.
  useEffect(() => () => {
    abortRef.current?.abort();
    if (backoffRef.current) clearTimeout(backoffRef.current);
  }, []);

  // Debounced search → feed.
  const trimmedSearch = searchQuery.trim();
  useEffect(() => {
    const q: FeedQuery = { mediaType, query: trimmedSearch, genre };
    if (keyOf(q) === requestedKeyRef.current) return;
    const t = setTimeout(() => load(q, 1), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [trimmedSearch, mediaType, genre, load]);

  const setMediaType = useCallback((type: MediaType) => {
    if (type === mediaType) return;
    setMediaTypeState(type);
    load({ mediaType: type, query: trimmedSearch, genre }, 1);
  }, [mediaType, trimmedSearch, genre, load]);

  /** Typing a search clears the genre filter (they are mutually exclusive). */
  const setSearchQuery = useCallback((value: string) => {
    setSearchQueryState(value);
    if (genre) setGenre(null);
  }, [genre]);

  const clearSearch = useCallback(() => {
    setSearchQueryState('');
    load({ mediaType, query: '', genre }, 1);
  }, [mediaType, genre, load]);

  /** Picking a genre clears any search. `null` = All. */
  const selectGenre = useCallback((next: string | null) => {
    if (searchQuery) setSearchQueryState('');
    if (next === genre && !trimmedSearch) return;
    setGenre(next);
    load({ mediaType, query: '', genre: next }, 1);
  }, [searchQuery, trimmedSearch, genre, mediaType, load]);

  const clearFilters = useCallback(() => {
    setSearchQueryState('');
    setGenre(null);
    load({ mediaType, query: '', genre: null }, 1);
  }, [mediaType, load]);

  const currentQuery: FeedQuery = { mediaType, query: trimmedSearch, genre };
  const currentKey = keyOf(currentQuery);

  const loadMore = useCallback(() => {
    if (feed.status !== 'ready' || !feed.hasMore || feed.key !== currentKey) return;
    load({ mediaType, query: trimmedSearch, genre }, feed.page + 1);
  }, [feed.status, feed.hasMore, feed.key, feed.page, currentKey, mediaType, trimmedSearch, genre, load]);

  const retry = useCallback(() => {
    softErrorsRef.current = 0;
    const page = feed.key === currentKey && feed.movies.length > 0 ? feed.page + 1 : 1;
    load({ mediaType, query: trimmedSearch, genre }, page);
  }, [feed.key, feed.movies.length, feed.page, currentKey, mediaType, trimmedSearch, genre, load]);

  // Infinite scroll — observe the sentinel while auto-loading is allowed.
  const canAutoLoad = feed.status === 'ready' && feed.hasMore && feed.movies.length > 0
    && feed.page < MAX_AUTO_PAGES && feed.key === currentKey;
  useEffect(() => {
    if (!sentinel || !canAutoLoad) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      const wait = MIN_PAGE_INTERVAL_MS - (Date.now() - lastFetchRef.current);
      clearTimeout(timer);
      if (wait > 0) timer = setTimeout(loadMore, wait);
      else loadMore();
    }, { rootMargin: '400px', threshold: 0.05 });
    observer.observe(sentinel);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [sentinel, canAutoLoad, loadMore]);

  const isStale = feed.key !== currentKey;
  return {
    // query
    mediaType, setMediaType,
    searchQuery, setSearchQuery, clearSearch,
    genre, selectGenre, clearFilters,
    // feed
    movies:       feed.movies,
    moviesType:   feed.mediaType,
    page:         feed.page,
    hasMore:      feed.hasMore,
    error:        feed.error,
    /** First load with nothing to show yet → skeleton. */
    initialLoading: feed.status === 'loading' && feed.movies.length === 0,
    /** Query changed while old results are still visible → dim them. */
    swapping:     (feed.status === 'loading' && feed.movies.length > 0) || (isStale && feed.status !== 'error'),
    loadingMore:  feed.status === 'loadingMore',
    isEmpty:      feed.status === 'ready' && feed.movies.length === 0 && !isStale,
    autoLoadCapped: feed.page >= MAX_AUTO_PAGES,
    loadMore, retry,
    sentinelRef:  setSentinel,
  };
}
