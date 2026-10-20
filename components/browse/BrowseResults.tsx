'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import BrowseCard from './BrowseCard';
import { BrowseGridSkeleton } from './BrowseSkeleton';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';
import type { MediaType } from './useBrowseFeed';

interface BrowseResultsProps {
  movies:         TmdbDiscoverMovie[];
  mediaType:      MediaType;
  from:           string;
  canSave:        boolean;
  page:           number;
  hasMore:        boolean;
  error:          string | null;
  initialLoading: boolean;
  swapping:       boolean;
  loadingMore:    boolean;
  isEmpty:        boolean;
  autoLoadCapped: boolean;
  /** Label of the active search/genre, for the empty state. */
  filterLabel:    string | null;
  onClearFilters: () => void;
  onRetry:        () => void;
  onLoadMore:     () => void;
  sentinelRef:    (el: HTMLDivElement | null) => void;
}

export default function BrowseResults({ sentinelRef, ...p }: BrowseResultsProps) {
  if (p.initialLoading) {
    return (
      <div role="status" aria-label="Loading titles">
        <BrowseGridSkeleton count={12} />
      </div>
    );
  }

  if (p.error && p.movies.length === 0) {
    return (
      <div className="empty-state" role="alert">
        <AlertCircle size={32} aria-hidden="true" />
        <p className="empty-state-title">Something went wrong</p>
        <p className="empty-state-body">{p.error}</p>
        <button type="button" className="btn-secondary" onClick={p.onRetry}>
          <RefreshCw size={16} aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }

  if (p.isEmpty) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Nothing found</p>
        <p className="empty-state-body">
          No titles match{p.filterLabel ? ` “${p.filterLabel}”` : ''}. Try a different search or genre.
        </p>
        {p.filterLabel && (
          <button type="button" className="btn-secondary" onClick={p.onClearFilters}>Clear filters</button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`browse-results${p.swapping ? ' is-swapping' : ''}`} aria-busy={p.swapping}>
        <div className="browse-grid">
          {p.movies.map(movie => (
            <BrowseCard key={movie.id} movie={movie} mediaType={p.mediaType} from={p.from} canSave={p.canSave} />
          ))}
        </div>
      </div>

      {p.error && (
        <div className="browse-error-banner" role="alert">
          <p>{p.error}</p>
          <button type="button" className="btn-secondary" onClick={p.onRetry}>
            <RefreshCw size={16} aria-hidden="true" /> Try again
          </button>
        </div>
      )}

      {p.hasMore && p.movies.length > 0 && !p.error && (
        <div className="browse-infinite-status" aria-live="polite">
          {p.autoLoadCapped && !p.loadingMore ? (
            <>
              <p className="browse-infinite-note">
                Showing the first ~{p.page * 20} results. Narrow your search or genre to find something specific.
              </p>
              <button type="button" className="btn-secondary" onClick={p.onLoadMore}>Load more</button>
            </>
          ) : p.loadingMore ? (
            <>
              <div className="browse-infinite-spinner" aria-hidden="true" />
              <span className="browse-infinite-note">Loading more…</span>
            </>
          ) : null}
          <div ref={sentinelRef} className="browse-sentinel" aria-hidden="true" />
        </div>
      )}

      {!p.hasMore && p.movies.length > 0 && !p.error && !p.swapping && (
        <div className="browse-end-marker">
          <div className="browse-end-line" />
          <span>End of results</span>
          <div className="browse-end-line" />
        </div>
      )}
    </>
  );
}
