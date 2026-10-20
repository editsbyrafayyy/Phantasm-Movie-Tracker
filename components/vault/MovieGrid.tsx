'use client';

import { useCallback, useDeferredValue, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Copy, Grid3x3, LayoutGrid, ListChecks, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/motion';
import MovieCard from './MovieCard';
import VaultFilters, { applyVaultFilters, DEFAULT_FILTERS, type VaultFilterState } from './VaultFilters';
import SubgenreDistributionBar from './SubgenreDistributionBar';
import Toast from '@/components/ui/Toast';
import type { VaultGridEntry } from '@/lib/types';

interface MovieGridProps {
  entries: VaultGridEntry[];
}

// ── Grid density, persisted per browser ───────────────────────────────────────
type Density = 'comfortable' | 'compact';
const DENSITY_KEY = 'vault_grid_density';
const DENSITY_EVENT = 'vault-density-change';

function readDensity(): Density {
  try {
    return localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable';
  } catch {
    return 'comfortable';
  }
}
function subscribeDensity(cb: () => void) {
  window.addEventListener('storage', cb);
  window.addEventListener(DENSITY_EVENT, cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(DENSITY_EVENT, cb);
  };
}
function writeDensity(d: Density) {
  try { localStorage.setItem(DENSITY_KEY, d); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(DENSITY_EVENT));
}

export default function MovieGrid({ entries }: MovieGridProps) {
  const searchParams = useSearchParams();
  const subgenreParam = searchParams.get('subgenre');
  const tagParam = searchParams.get('tag');

  const [filters, setFilters] = useState<VaultFilterState>(() => ({
    ...DEFAULT_FILTERS,
    genre: subgenreParam,
    tag: tagParam,
  }));

  // Follow ?subgenre= / ?tag= changes while mounted (adjust state during render — no effect).
  const [seenParams, setSeenParams] = useState({ subgenreParam, tagParam });
  if (seenParams.subgenreParam !== subgenreParam || seenParams.tagParam !== tagParam) {
    setSeenParams({ subgenreParam, tagParam });
    setFilters(f => ({ ...f, genre: subgenreParam, tag: tagParam }));
  }

  const density = useSyncExternalStore(subscribeDensity, readDensity, () => 'comfortable' as Density);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);

  const deferredFilters = useDeferredValue(filters);
  const filtered = useMemo(() => applyVaultFilters(entries, deferredFilters), [entries, deferredFilters]);

  const patchFilters = useCallback((patch: Partial<VaultFilterState>) => {
    setFilters(f => ({ ...f, ...patch }));
  }, []);
  const clearAll = useCallback(() => {
    setFilters(f => ({ ...DEFAULT_FILTERS, sort: f.sort }));
  }, []);
  const filterBySubgenre = useCallback((genre: string) => {
    setFilters(f => ({ ...f, genre: f.genre === genre ? null : genre }));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  function toggleSelectMode() {
    setSelectMode(on => !on);
    setSelectedIds([]);
  }

  async function handleBatchCopy() {
    if (!selectedIds.length) return;
    const text = entries
      .filter(e => selectedIds.includes(e.id))
      .map(e => `${e.movie.title}${e.movie.year ? ` (${e.movie.year})` : ''} — ${e.total ?? '—'}/10`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: `Copied ${selectedIds.length} summar${selectedIds.length === 1 ? 'y' : 'ies'}`, type: 'success' });
    } catch {
      setToast({ message: 'Could not copy to clipboard', type: 'error' });
    }
  }

  const nextDensity: Density = density === 'compact' ? 'comfortable' : 'compact';

  const toolbarActions = (
    <>
      <button
        type="button"
        className="icon-btn vault-tool-btn"
        onClick={() => writeDensity(nextDensity)}
        aria-label={density === 'compact' ? 'Switch to comfortable grid' : 'Switch to compact grid'}
        title={density === 'compact' ? 'Comfortable grid' : 'Compact grid'}
      >
        {density === 'compact' ? <LayoutGrid size={16} /> : <Grid3x3 size={16} />}
      </button>
      <button
        type="button"
        className={`icon-btn vault-tool-btn${selectMode ? ' is-active' : ''}`}
        onClick={toggleSelectMode}
        aria-pressed={selectMode}
        aria-label={selectMode ? 'Exit select mode' : 'Select films'}
        title={selectMode ? 'Exit select mode' : 'Select films'}
      >
        <ListChecks size={16} />
      </button>
    </>
  );

  return (
    <div className="vault-content">
      <SubgenreDistributionBar entries={entries} activeGenre={filters.genre} onSelectGenre={filterBySubgenre} />

      <div className="vault-filter-bar">
        <VaultFilters
          filters={filters}
          onChange={patchFilters}
          onClearAll={clearAll}
          resultCount={filtered.length}
          totalCount={entries.length}
          actions={toolbarActions}
        />
      </div>

      {selectMode && (
        <p className="vault-select-hint" role="status">
          Select films to copy their summaries. {selectedIds.length > 0 && `${selectedIds.length} selected.`}
        </p>
      )}

      {filtered.length === 0 ? (
        entries.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">Your vault is empty</p>
            <p className="empty-state-body">Rate your first film to start building your collection.</p>
            <Link href="/add" className="btn-primary">Log a film</Link>
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state-title">No films match</p>
            <p className="empty-state-body">Try a different search or loosen your filters.</p>
            <button type="button" className="btn-secondary" onClick={clearAll}>Clear filters</button>
          </div>
        )
      ) : (
        <motion.ul
          className={`movie-grid vault-movie-grid${density === 'compact' ? ' compact-grid' : ''}`}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          aria-label={`${filtered.length} films`}
        >
          {filtered.map((entry, idx) => (
            <MovieCard
              key={entry.id}
              entry={entry}
              priority={idx < 8}
              selectMode={selectMode}
              selected={selectMode && selectedIds.includes(entry.id)}
              onToggleSelect={toggleSelect}
              onSubgenreClick={filterBySubgenre}
            />
          ))}
        </motion.ul>
      )}

      {selectMode && selectedIds.length > 0 && (
        <div className="vault-bulk-bar" role="region" aria-label="Bulk actions">
          <span className="vault-bulk-count">{selectedIds.length} selected</span>
          <button type="button" onClick={handleBatchCopy} className="btn-primary vault-bulk-copy">
            <Copy size={16} aria-hidden="true" />
            Copy summaries
          </button>
          <button type="button" className="icon-btn" onClick={() => setSelectedIds([])} aria-label="Clear selection">
            <X size={16} />
          </button>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
