'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Star, Film, Plus } from 'lucide-react';
import CategoryRow from '@/components/browse/CategoryRow';
import CustomSelect from '@/components/ui/CustomSelect';
import type { Entry } from '@/lib/types';

type Props = {
  entries: Entry[];
  subgenreOrder: string[];
  ownerName?: string;
};

export default function VaultFilter({ entries, subgenreOrder, ownerName = 'Rafayyy' }: Props) {
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
    <div style={{ marginTop: 0, paddingTop: 16, paddingBottom: 80 }}>
      {/* Search & Filter Controls Bar */}
      <div className="home-vault-filters" style={{ opacity: isPending ? 0.7 : 1, transition: 'opacity 0.15s' }}>
        {/* Search Input */}
        <div className="home-vault-search-container">
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Search Rated Films
          </label>
          <div className="home-vault-search-wrap">
            <Search className="home-vault-search-icon" size={15} />
            <input
              type="text"
              className="home-vault-search-input"
              placeholder={`Search ${ownerName}'s rated horror movies (title, director, cast)...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label={`Search ${ownerName}'s rated films`}
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
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Recommended Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Verdict
          </label>
          <CustomSelect
            value={recFilter}
            onChange={(v) => startTransition(() => setRecFilter(v))}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Peak', label: 'Peak' },
              { value: 'Yes', label: 'Yes' },
              { value: 'No', label: 'No' },
              { value: 'Garbage', label: 'Garbage' },
            ]}
            ariaLabel="Filter by recommendation"
          />
        </div>

        {/* Genre Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Genre
          </label>
          <CustomSelect
            value={genreFilter}
            onChange={(v) => startTransition(() => setGenreFilter(v))}
            options={[
              { value: 'All', label: 'All Genres' },
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
                <span className="home-search-summary-text">
                  Found <strong className="home-search-summary-count">{searchedEntries.length}</strong> {searchedEntries.length === 1 ? 'film' : 'films'} rated by {ownerName} matching &ldquo;{debouncedSearch}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedSearch('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--red)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  Clear search
                </button>
              </div>

              <div className="home-search-grid">
                {searchedEntries.map(entry => {
                  const poster = entry.movie?.poster_url;
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
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 50vw, 220px"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Film size={28} color="rgba(255,255,255,0.25)" />
                          </div>
                        )}

                        {/* Owner's Score Badge */}
                        {entry.total !== null && entry.total !== undefined && entry.total > 0 && (
                          <span className="home-search-score-badge">
                            <Star size={10} fill="currentColor" style={{ color: '#ffd700' }} />
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
            <div className="home-search-empty">
              <Search size={32} style={{ color: 'var(--red)', opacity: 0.8, marginBottom: 12 }} />
              <h3 className="home-search-empty-title">No rated films found for &ldquo;{debouncedSearch}&rdquo;</h3>
              <p className="home-search-empty-sub">
                {ownerName} has not logged or rated this film in the vault yet.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
                <Link
                  href={`/add?title=${encodeURIComponent(debouncedSearch)}`}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto' }}
                >
                  <Plus size={14} />
                  Add &ldquo;{debouncedSearch}&rdquo; to Vault
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedSearch('');
                  }}
                  className="btn-edit"
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
            <div style={{
              padding:'80px 48px', textAlign:'center',
              color:'var(--text-muted)', fontFamily:'var(--font-sans)', fontSize:14,
            }}>
              No films match your selected filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}
