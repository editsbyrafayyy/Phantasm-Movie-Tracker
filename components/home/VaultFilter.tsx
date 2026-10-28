'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { gridPosterUrl } from '@/components/vault/posterSrc';
import Link from 'next/link';
import { Search, X, Film, Plus } from 'lucide-react';
import CategoryRow from '@/components/browse/CategoryRow';
import CustomSelect from '@/components/ui/CustomSelect';
import type { Entry } from '@/lib/types';

type Props = {
  entries: Entry[];
  subgenreOrder: string[];
  ownerName?: string;
  /** Signed-in members get a "Log this film" shortcut on empty searches. */
  canAdd?: boolean;
};

export default function VaultFilter({ entries, subgenreOrder, ownerName = 'Rafayyy', canAdd = false }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [recFilter, setRecFilter] = useState<string>('All');
  const [genreFilter, setGenreFilter] = useState<string>('All');
  const [isPending, startTransition] = useTransition();

  // Debounce search query to keep typing fluid
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = debouncedSearch.trim().length > 0;
  const q = debouncedSearch.toLowerCase().trim();

  // Active search results
  const searchedEntries = useMemo(() => {
    if (!isSearching) return [];
    return entries.filter(entry => {
      const titleMatch = entry.movie?.title?.toLowerCase().includes(q);
      const directorMatch = entry.movie?.director?.toLowerCase().includes(q);
      const castMatch = entry.movie?.cast_list?.some(c => (typeof c === 'string' ? c : c?.name)?.toLowerCase().includes(q));
      const subgenreMatch = entry.subgenre?.toLowerCase().includes(q);
      const secondaryMatch = entry.secondary_tag?.toLowerCase().includes(q);
      const tagMatch = entry.custom_tags?.some(t => t.toLowerCase().includes(q));
      const noteMatch = entry.notes?.toLowerCase().includes(q);

      const matchesSearch = titleMatch || directorMatch || castMatch || subgenreMatch || secondaryMatch || tagMatch || noteMatch;

      // Recommendation Filter
      let recMatch = true;
      if (recFilter !== 'All') {
        if (entry.recommend !== recFilter) recMatch = false;
      }

      // Genre Filter
      let genreMatch = true;
      if (genreFilter !== 'All') {
        if (entry.subgenre !== genreFilter) genreMatch = false;
      }

      return matchesSearch && recMatch && genreMatch;
    });
  }, [entries, isSearching, q, recFilter, genreFilter]);

  // Default carousel entries (when not searching)
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Recommendation Filter
      let recMatch = true;
      if (recFilter !== 'All') {
        if (entry.recommend !== recFilter) recMatch = false;
      }

      // Genre Filter
      let genreMatch = true;
      if (genreFilter !== 'All') {
        if (entry.subgenre !== genreFilter) genreMatch = false;
      }

      return recMatch && genreMatch;
    });
  }, [entries, recFilter, genreFilter]);

  // Group by subgenre for the category rows
  const bySubgenre = useMemo(() => {
    const grouped: Record<string, Entry[]> = {};
    for (const entry of filteredEntries) {
      if (!grouped[entry.subgenre]) grouped[entry.subgenre] = [];
      grouped[entry.subgenre].push(entry);
    }
    return grouped;
  }, [filteredEntries]);

  // Unique genres present in the user's actual entries
  const availableGenres = useMemo(() => {
    const genres = new Set(entries.map(e => e.subgenre).filter(Boolean));
    return Array.from(genres).sort();
  }, [entries]);

  return (
    <div className="home-vault-body">
      {/* Search & Filter Controls Bar */}
      <div className={`home-vault-filters${isPending ? ' is-pending' : ''}`}>
        {/* Search Input */}
        <div className="home-vault-search-container">
          <label htmlFor="home-vault-search" className="home-filter-label">
            Search
          </label>
          <div className="home-vault-search-wrap">
            <Search className="home-vault-search-icon" size={16} aria-hidden="true" />
            <input
              id="home-vault-search"
              type="search"
              className="home-vault-search-input"
              placeholder="Title, director, cast, tag…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="home-vault-search-clear"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                }}
                aria-label="Clear search"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Recommended Filter */}
        <div className="home-filter-field">
          <span className="home-filter-label" aria-hidden="true">Verdict</span>
          <CustomSelect
            value={recFilter}
            onChange={(v) => startTransition(() => setRecFilter(v))}
            options={[
              { value: 'All', label: 'All verdicts' },
              { value: 'Peak', label: 'Peak' },
              { value: 'Yes', label: 'Yes' },
              { value: 'No', label: 'No' },
              { value: 'Garbage', label: 'Garbage' },
            ]}
            ariaLabel="Filter by verdict"
          />
        </div>

        {/* Genre Filter */}
        <div className="home-filter-field">
          <span className="home-filter-label" aria-hidden="true">Genre</span>
          <CustomSelect
            value={genreFilter}
            onChange={(v) => startTransition(() => setGenreFilter(v))}
            options={[
              { value: 'All', label: 'All genres' },
              ...availableGenres.map(g => ({ value: g, label: g })),
            ]}
            ariaLabel="Filter by genre"
            align="right"
          />
        </div>
      </div>

      {/* ── Active Search Results View ─────────────────────────────────── */}
      {isSearching ? (
        <div className="home-search-results-container">
          {searchedEntries.length > 0 ? (
            <>
              <div className="home-search-summary-bar">
                <span className="home-search-summary-text" aria-live="polite">
                  Found <strong className="home-search-summary-count">{searchedEntries.length}</strong> {searchedEntries.length === 1 ? 'film' : 'films'} rated by {ownerName} matching &ldquo;{debouncedSearch}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedSearch('');
                  }}
                  className="text-btn home-search-clear-link"
                >
                  Clear search
                </button>
              </div>

              <div className="home-search-grid">
                {searchedEntries.map(entry => {
                  const poster = gridPosterUrl(entry.movie?.poster_url ?? null);
                  const title = entry.movie?.title ?? 'Unknown';
                  const year = entry.movie?.year;
                  const director = entry.movie?.director;
                  const runtime = entry.movie?.runtime_min;

                  return (
                    <Link
                      key={entry.id}
                      href={`/vault/${entry.id}`}
                      className="home-search-card"
                    >
                      <div className="home-search-poster-wrap">
                        {poster ? (
                          <Image
                            src={poster}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 50vw, 220px"
                            className="home-search-poster-img"
                          />
                        ) : (
                          <div className="home-search-poster-fallback">
                            <Film size={32} aria-hidden="true" />
                          </div>
                        )}

                        {/* Owner's Score Badge */}
                        {entry.total !== null && entry.total !== undefined && entry.total > 0 && (
                          <span className="home-search-score-badge">
                            <span>{entry.total}</span>
                            <small>/10</small>
                          </span>
                        )}

                        {/* Recommendation Pill */}
                        {entry.recommend && (
                          <span className={`home-search-rec-badge rec-${entry.recommend.toLowerCase()}`}>
                            {entry.recommend}
                          </span>
                        )}
                      </div>

                      <div className="home-search-card-info">
                        <h4 className="home-search-card-title">{title}</h4>
                        <p className="home-search-card-meta">
                          {[year, director, runtime ? `${runtime}m` : null].filter(Boolean).join(' · ')}
                        </p>
                        {entry.subgenre && (
                          <span className="home-search-card-subgenre">{entry.subgenre}</span>
                        )}
                        {entry.notes && (
                          <p className="home-search-card-note">&ldquo;{entry.notes}&rdquo;</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Search size={32} aria-hidden="true" />
              <h3 className="empty-state-title">No matches for &ldquo;{debouncedSearch}&rdquo;</h3>
              <p className="empty-state-body">
                {ownerName} hasn&apos;t rated this one yet.
              </p>
              <div className="home-search-empty-actions">
                {canAdd && (
                  <Link
                    href={`/add?title=${encodeURIComponent(debouncedSearch)}`}
                    className="btn-primary"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Log &ldquo;{debouncedSearch}&rdquo;
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedSearch('');
                  }}
                  className="btn-secondary"
                >
                  Clear search
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Default Category Carousel Rows ───────────────────────────── */
        <>
          {subgenreOrder.map(genre => {
            const genreEntries = bySubgenre[genre];
            const isFiltering = recFilter !== 'All' || genreFilter !== 'All';
            if (!genreEntries || (!isFiltering && genreEntries.length < 2)) return null;
            return <CategoryRow key={genre} label={genre} entries={genreEntries} />;
          })}

          {filteredEntries.length === 0 && (
            <div className="empty-state">
              <p className="empty-state-title">Nothing stirs here</p>
              <p className="empty-state-body">I haven&rsquo;t rated anything that fits both of those.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
