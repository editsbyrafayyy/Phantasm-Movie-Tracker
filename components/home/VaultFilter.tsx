'use client';

import { useState, useMemo } from 'react';
import CategoryRow from '@/components/browse/CategoryRow';
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
      <div style={{ display: 'flex', gap: 24, padding: '0 32px', marginBottom: 32 }}>
        {/* Recommended Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Recommended</label>
          <select 
            value={recFilter} 
            onChange={e => setRecFilter(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All" style={{ color: '#000' }}>All Statuses</option>
            <option value="Peak" style={{ color: '#000' }}>Peak</option>
            <option value="Yes" style={{ color: '#000' }}>Yes</option>
            <option value="No" style={{ color: '#000' }}>No</option>
            <option value="Garbage" style={{ color: '#000' }}>Garbage</option>
          </select>
        </div>

        {/* Genre Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Genre</label>
          <select 
            value={genreFilter} 
            onChange={e => setGenreFilter(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All" style={{ color: '#000' }}>All Genres</option>
            {availableGenres.map(g => (
              <option key={g} value={g} style={{ color: '#000' }}>{g}</option>
            ))}
          </select>
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
