'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { SUBGENRES } from '@/lib/config';
import type { Entry } from '@/lib/types';

type SortKey = 'az' | 'za' | 'top' | 'recent';
type YearBucket = 'all' | 'pre1980' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'top',    label: 'Highest Rated'  },
  { value: 'az',     label: 'A → Z'          },
  { value: 'za',     label: 'Z → A'          },
];

const YEAR_OPTIONS: { value: YearBucket; label: string }[] = [
  { value: 'all',    label: 'All Years'  },
  { value: '2020s',  label: '2020s'      },
  { value: '2010s',  label: '2010s'      },
  { value: '2000s',  label: '2000s'      },
  { value: '1990s',  label: '1990s'      },
  { value: '1980s',  label: '1980s'      },
  { value: 'pre1980',label: 'Before 1980'},
];

interface VaultFiltersProps {
  entries:        Entry[];
  onFiltered:     (result: Entry[]) => void;
}

export default function VaultFilters({ entries, onFiltered }: VaultFiltersProps) {
  const [search,          setSearch]          = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGenre,   setGenre]           = useState('All');
  const [selectedRec,     setRec]             = useState('All');
  const [sort,            setSort]            = useState<SortKey>('recent');
  const [ratingFilter,    setRatingFilter]    = useState<'all' | 'rated' | 'unrated'>('all');
  const [yearBucket,      setYearBucket]      = useState<YearBucket>('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    let result = [...entries];

    // Search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
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

    // Year bucket filter
    if (yearBucket !== 'all') {
      result = result.filter(e => {
        const y = e.movie?.year;
        if (!y) return false;
        if (yearBucket === 'pre1980') return y < 1980;
        if (yearBucket === '1980s')   return y >= 1980 && y < 1990;
        if (yearBucket === '1990s')   return y >= 1990 && y < 2000;
        if (yearBucket === '2000s')   return y >= 2000 && y < 2010;
        if (yearBucket === '2010s')   return y >= 2010 && y < 2020;
        if (yearBucket === '2020s')   return y >= 2020;
        return true;
      });
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
  }, [entries, debouncedSearch, selectedGenre, selectedRec, ratingFilter, yearBucket, sort]);

  // Propagate filtered results to parent whenever they change
  useEffect(() => {
    onFiltered(filtered);
  }, [filtered, onFiltered]);

  const activeFilterCount = 
    (selectedGenre !== 'All' ? 1 : 0) + 
    (selectedRec !== 'All' ? 1 : 0) + 
    (ratingFilter !== 'all' ? 1 : 0) +
    (yearBucket !== 'all' ? 1 : 0);

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

      {/* Decade Pills Row */}
      <div className="vault-decade-pills" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginTop: 10, scrollbarWidth: 'none' }}>
        {YEAR_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`btn-edit ${yearBucket === opt.value ? 'active' : ''}`}
            onClick={() => setYearBucket(opt.value as YearBucket)}
            style={{ fontSize: 11, padding: '4px 12px', height: 28, flexShrink: 0, borderRadius: 14 }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Selects Row — responsive grid */}
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

        <CustomSelect
          value={yearBucket}
          onChange={val => setYearBucket(val as YearBucket)}
          options={YEAR_OPTIONS}
          ariaLabel="Filter by decade"
        />
      </div>

      {/* Active filter count / Clear */}
      {activeFilterCount > 0 && (
        <button
          className="vault-clear-filters"
          onClick={() => { setGenre('All'); setRec('All'); setRatingFilter('all'); setYearBucket('all'); }}
          style={{ marginTop: 12 }}
        >
          Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
