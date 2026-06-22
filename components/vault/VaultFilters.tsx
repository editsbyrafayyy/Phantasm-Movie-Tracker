'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { SUBGENRES } from '@/lib/config';
import type { Entry } from '@/lib/types';

type SortKey = 'az' | 'za' | 'top' | 'recent';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'top',    label: 'Highest Rated'  },
  { value: 'az',     label: 'A → Z'          },
  { value: 'za',     label: 'Z → A'          },
];

interface VaultFiltersProps {
  entries:        Entry[];
  onFiltered:     (result: Entry[]) => void;
}

export default function VaultFilters({ entries, onFiltered }: VaultFiltersProps) {
  const [search,        setSearch]       = useState('');
  const [selectedGenre, setGenre]        = useState('All');
  const [selectedRec,   setRec]          = useState('All');
  const [sort,          setSort]         = useState<SortKey>('recent');
  const [ratingFilter,  setRatingFilter] = useState<'all' | 'rated' | 'unrated'>('all');

  const filtered = useMemo(() => {
    let result = [...entries];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => e.movie?.title?.toLowerCase().includes(q));
    }

    // Subgenre filter (single-select)
    if (selectedGenre !== 'All') {
      result = result.filter(e => e.subgenre === selectedGenre);
    }

    // Recommend filter
    if (selectedRec !== 'All') {
      result = result.filter(e => e.recommend === selectedRec);
    }

    // Rating filter (Rated vs Not Rated)
    if (ratingFilter === 'rated') {
      result = result.filter(e => e.total !== null && e.total > 0);
    } else if (ratingFilter === 'unrated') {
      result = result.filter(e => e.total === null || e.total === 0);
    }

    // Sort
    switch (sort) {
      case 'az':
        result.sort((a, b) => {
          const tA = (a.movie?.title ?? '').toLowerCase();
          const tB = (b.movie?.title ?? '').toLowerCase();
          return tA < tB ? -1 : tA > tB ? 1 : 0;
        });
        break;
      case 'za':
        result.sort((a, b) => {
          const tA = (a.movie?.title ?? '').toLowerCase();
          const tB = (b.movie?.title ?? '').toLowerCase();
          return tA > tB ? -1 : tA < tB ? 1 : 0;
        });
        break;
      case 'top':
        result.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
        break;
      case 'recent':
        result.sort((a, b) => {
          const tA = a.created_at;
          const tB = b.created_at;
          return tA > tB ? -1 : tA < tB ? 1 : 0;
        });
        break;
    }

    return result;
  }, [entries, search, selectedGenre, selectedRec, ratingFilter, sort]);

  // Propagate filtered results to parent whenever they change
  useEffect(() => {
    onFiltered(filtered);
  }, [filtered, onFiltered]);

  const activeFilterCount = 
    (selectedGenre !== 'All' ? 1 : 0) + 
    (selectedRec !== 'All' ? 1 : 0) + 
    (ratingFilter !== 'all' ? 1 : 0);

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

      {/* Selects Row — 2×2 grid on all sizes */}
      <div className="vault-selects-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', marginTop: 12 }}>
        <CustomSelect
          value={selectedGenre}
          onChange={setGenre}
          options={[
            { value: 'All', label: 'All Genres' },
            ...SUBGENRES.map(g => ({ value: g, label: g })),
          ]}
          ariaLabel="Filter by genre"
        />

        <CustomSelect
          value={selectedRec}
          onChange={setRec}
          options={[
            { value: 'All', label: 'All Statuses' },
            { value: 'Peak', label: 'Peak' },
            { value: 'Yes', label: 'Yes' },
            { value: 'No', label: 'No' },
            { value: 'Garbage', label: 'Garbage' },
          ]}
          ariaLabel="Filter by recommendation"
        />

        <CustomSelect
          value={sort}
          options={SORT_OPTIONS}
          onChange={val => setSort(val as SortKey)}
          ariaLabel="Sort movies"
          icon={<SlidersHorizontal size={13} />}
        />

        <CustomSelect
          value={ratingFilter}
          onChange={val => setRatingFilter(val as 'all' | 'rated' | 'unrated')}
          options={[
            { value: 'all', label: 'All Ratings' },
            { value: 'rated', label: 'Rated' },
            { value: 'unrated', label: 'Not Rated' },
          ]}
          ariaLabel="Filter by rating status"
          align="right"
        />
      </div>

      {/* Active filter count / Clear */}
      {activeFilterCount > 0 && (
        <button
          className="vault-clear-filters"
          onClick={() => { setGenre('All'); setRec('All'); setRatingFilter('all'); }}
          style={{ marginTop: 12 }}
        >
          Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
