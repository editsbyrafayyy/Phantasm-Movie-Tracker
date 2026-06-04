'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { SUBGENRES } from '@/lib/config';
import type { Entry } from '@/lib/types';

type SortKey = 'az' | 'za' | 'top' | 'recent';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'top',    label: 'Highest Rated'  },
  { value: 'az',     label: 'A → Z'          },
  { value: 'za',     label: 'Z → A'          },
];

const RECOMMEND_OPTIONS = ['Peak', 'Yes', 'No', 'Garbage'];

interface VaultFiltersProps {
  entries:        Entry[];
  onFiltered:     (result: Entry[]) => void;
}

export default function VaultFilters({ entries, onFiltered }: VaultFiltersProps) {
  const [search,       setSearch]       = useState('');
  const [selectedGenres, setGenres]     = useState<string[]>([]);
  const [selectedRec,  setRec]          = useState('');
  const [sort,         setSort]         = useState<SortKey>('recent');

  const filtered = useMemo(() => {
    let result = [...entries];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => e.movie?.title?.toLowerCase().includes(q));
    }

    // Subgenre filter (multi-select — any match)
    if (selectedGenres.length > 0) {
      result = result.filter(e => selectedGenres.includes(e.subgenre));
    }

    // Recommend filter
    if (selectedRec) {
      result = result.filter(e => e.recommend === selectedRec);
    }

    // Sort
    switch (sort) {
      case 'az':     result.sort((a, b) => (a.movie?.title ?? '').localeCompare(b.movie?.title ?? '')); break;
      case 'za':     result.sort((a, b) => (b.movie?.title ?? '').localeCompare(a.movie?.title ?? '')); break;
      case 'top':    result.sort((a, b) => (b.total ?? 0) - (a.total ?? 0)); break;
      case 'recent': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }

    return result;
  }, [entries, search, selectedGenres, selectedRec, sort]);

  // Propagate filtered results to parent whenever they change
  useEffect(() => {
    onFiltered(filtered);
  }, [filtered, onFiltered]);

  function toggleGenre(g: string) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  const activeFilterCount = selectedGenres.length + (selectedRec ? 1 : 0);

  return (
    <div className="vault-filters">
      {/* Search */}
      <div className="vault-search-wrap">
        <Search size={14} className="vault-search-icon" aria-hidden="true" />
        <input
          type="search"
          className="vault-search"
          placeholder="Search titles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search movies"
        />
      </div>

      {/* Subgenre pills */}
      <div className="vault-genre-pills" role="group" aria-label="Filter by subgenre">
        {SUBGENRES.map(g => (
          <button
            key={g}
            className={`vault-filter-pill${selectedGenres.includes(g) ? ' active' : ''}`}
            onClick={() => toggleGenre(g)}
            aria-pressed={selectedGenres.includes(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Recommend + Sort row */}
      <div className="vault-filter-row">
        <div className="vault-rec-pills" role="group" aria-label="Filter by recommendation">
          {RECOMMEND_OPTIONS.map(r => (
            <button
              key={r}
              className={`vault-filter-pill vault-rec-pill vault-rec-pill-${r.toLowerCase()}${selectedRec === r ? ' active' : ''}`}
              onClick={() => setRec(prev => prev === r ? '' : r)}
              aria-pressed={selectedRec === r}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="vault-sort-wrap">
          <SlidersHorizontal size={13} className="vault-sort-icon" aria-hidden="true" />
          <select
            className="vault-sort"
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            aria-label="Sort movies"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter count */}
      {activeFilterCount > 0 && (
        <button
          className="vault-clear-filters"
          onClick={() => { setGenres([]); setRec(''); }}
        >
          Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
