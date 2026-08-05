'use client';

import { useState, useCallback } from 'react';
import { Film, LayoutGrid, Grid } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/motion';
import MovieCard from './MovieCard';
import VaultFilters from './VaultFilters';
import type { Entry } from '@/lib/types';

import SubgenreDistributionBar from './SubgenreDistributionBar';

interface MovieGridProps {
  entries: Entry[];
}

export default function MovieGrid({ entries }: MovieGridProps) {
  const [filtered, setFiltered] = useState<Entry[]>(entries);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  const handleFiltered = useCallback((result: Entry[]) => {
    setFiltered(result);
  }, []);

  return (
    <div className="vault-content">
      {/* Subgenre makeup progress bar */}
      <SubgenreDistributionBar entries={entries} />

      {/* Grid density toggle bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
          <button
            onClick={() => setDensity('comfortable')}
            style={{
              background: density === 'comfortable' ? 'var(--surface)' : 'transparent',
              color: density === 'comfortable' ? 'var(--text)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Comfortable card grid density"
          >
            <LayoutGrid size={13} />
            Comfortable
          </button>
          <button
            onClick={() => setDensity('compact')}
            style={{
              background: density === 'compact' ? 'var(--surface)' : 'transparent',
              color: density === 'compact' ? 'var(--text)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Compact card grid density"
          >
            <Grid size={13} />
            Compact
          </button>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="vault-filter-bar">
        <VaultFilters entries={entries} onFiltered={handleFiltered} />
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="vault-empty">
          <div className="vault-empty-icon">
            <Film size={48} strokeWidth={0.8} aria-hidden="true" />
          </div>
          {entries.length === 0 ? (
            <>
              <p className="vault-empty-title">Your vault is empty.</p>
              <p className="vault-empty-sub">Add your first film to start building your collection.</p>
              <a href="/add" className="btn-primary vault-empty-cta">Add a Movie →</a>
            </>
          ) : (
            <>
              <p className="vault-empty-title">No films match your filters</p>
              <p className="vault-empty-sub">Try adjusting your search or clearing filters.</p>
            </>
          )}
        </div>
      ) : (
        <motion.div
          className={`movie-grid ${density === 'compact' ? 'compact-grid' : ''}`}
          style={density === 'compact' ? { gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 } : undefined}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          aria-label={`${filtered.length} films`}
        >
          {filtered.map(entry => (
            <MovieCard key={entry.id} entry={entry} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
