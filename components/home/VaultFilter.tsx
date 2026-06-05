'use client';

import { useState, useMemo } from 'react';
import CategoryRow from '@/components/browse/CategoryRow';
import CustomSelect from '@/components/ui/CustomSelect';
import type { Entry } from '@/lib/types';

type Props = {
  entries: Entry[];
  subgenreOrder: string[];
};

export default function VaultFilter({ entries, subgenreOrder }: Props) {
  const [recFilter, setRecFilter] = useState<string>('All');
  const [genreFilter, setGenreFilter] = useState<string>('All');

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Recommendation Filter
      let recMatch = true;
      if (recFilter !== 'All') {
        if (recFilter === 'Yes' && entry.recommend !== 'Yes') recMatch = false;
        if (recFilter === 'No' && entry.recommend !== 'No') recMatch = false;
        if (recFilter === 'Peak' && entry.recommend !== 'Peak') recMatch = false;
        if (recFilter === 'Garbage' && entry.recommend !== 'Garbage') recMatch = false;
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
      {/* Filters */}
      <div className="home-vault-filters">
        {/* Recommended Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Recommended</label>
          <CustomSelect
            value={recFilter}
            onChange={setRecFilter}
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
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Genre</label>
          <CustomSelect
            value={genreFilter}
            onChange={setGenreFilter}
            options={[
              { value: 'All', label: 'All Genres' },
              ...availableGenres.map(g => ({ value: g, label: g })),
            ]}
            ariaLabel="Filter by genre"
          />
        </div>
      </div>

      {/* Filter Results */}
      {subgenreOrder.map(genre => {
        const genreEntries = bySubgenre[genre];
        // If they filtered specifically by a genre, don't enforce the length < 2 rule so they can see their single movie
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
    </div>
  );
}
