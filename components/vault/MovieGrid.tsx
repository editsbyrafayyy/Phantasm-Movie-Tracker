'use client';

import { useState, useCallback } from 'react';
import { Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/motion';
import MovieCard from './MovieCard';
import VaultFilters from './VaultFilters';
import type { Entry } from '@/lib/types';

interface MovieGridProps {
  entries: Entry[];
}

export default function MovieGrid({ entries }: MovieGridProps) {
  const [filtered, setFiltered] = useState<Entry[]>(entries);

  const handleFiltered = useCallback((result: Entry[]) => {
    setFiltered(result);
  }, []);

  return (
    <div className="vault-content">
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
          className="movie-grid"
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
