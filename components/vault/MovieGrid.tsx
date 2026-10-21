'use client';

import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Copy, Grid3x3, ListChecks } from 'lucide-react';
import MovieCard from './MovieCard';
import VaultFilters, { applyVaultFilters, DEFAULT_FILTERS, type VaultFilterState } from './VaultFilters';
import SubgenreDistributionBar from './SubgenreDistributionBar';
import Toast from '@/components/ui/Toast';
import type { VaultGridEntry } from '@/lib/types';

interface MovieGridProps {
  entries: VaultGridEntry[];
}

// ── Progressive rendering ─────────────────────────────────────────────────────
// The first batch is server-rendered; later batches mount as the sentinel nears the viewport,
// so 276 films never hydrate, decode and lay out at once. 60 divides evenly into 2–5 columns.
const BATCH = 60;
/** Cards in the first row get eager, high-priority posters. */
const PRIORITY_COUNT = 5;

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

  // Incremental rendering: grow `limit` while the sentinel below the grid is near the viewport.
  // The observer is recreated after each batch so a still-visible sentinel fires again.
  const [limit, setLimit] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = filtered.length > limit;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) startTransition(() => setLimit(l => l + BATCH));
      },
      { rootMargin: '0px 0px 1200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, limit]);
  const visible = hasMore ? filtered.slice(0, limit) : filtered;

  // Sticky toolbar: only show the glass band once it is actually stuck under the navbar.
  const stickRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = stickRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 64),
      { rootMargin: '-57px 0px 0px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
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
      .map(e => `${e.movie.title}${e.movie.year ? ` (${e.movie.year})` : ''} — ${e.total !== null && e.total > 0 ? `${e.total}/10` : 'not rated yet'}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: `Copied ${selectedIds.length} summar${selectedIds.length === 1 ? 'y' : 'ies'}`, type: 'success' });
    } catch {
      setToast({ message: 'Could not copy to clipboard', type: 'error' });
    }
  }

  const compact = density === 'compact';

  const toolbarActions = (
    <div className="vault-view-toggles">
      <button
        type="button"
        className={`icon-btn vault-tool-btn${compact ? ' is-active' : ''}`}
        onClick={() => writeDensity(compact ? 'comfortable' : 'compact')}
        aria-pressed={compact}
        aria-label="Compact grid"
        data-tip="Compact grid"
      >
        <Grid3x3 size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`icon-btn vault-tool-btn${selectMode ? ' is-active' : ''}`}
        onClick={toggleSelectMode}
        aria-pressed={selectMode}
        aria-label="Select films"
        data-tip={selectMode ? 'Exit select mode' : 'Select films'}
        data-tip-align="end"
      >
        <ListChecks size={16} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="vault-content">
      <SubgenreDistributionBar entries={entries} activeGenre={filters.genre} onSelectGenre={filterBySubgenre} />

      <div ref={stickRef} className="vault-stick-sentinel" aria-hidden="true" />
      <div className={`vault-filter-bar${stuck ? ' is-stuck' : ''}`}>
        <VaultFilters
          filters={filters}
          onChange={patchFilters}
          onClearAll={clearAll}
          resultCount={filtered.length}
          totalCount={entries.length}
          actions={toolbarActions}
        />
      </div>

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
        <>
          <ul
            className={`movie-grid vault-movie-grid${compact ? ' compact-grid' : ''}${selectMode ? ' is-selecting' : ''}`}
            aria-label={`${filtered.length} films`}
          >
            {visible.map((entry, idx) => (
              <MovieCard
                key={entry.id}
                entry={entry}
                index={idx}
                priority={idx < PRIORITY_COUNT}
                selectMode={selectMode}
                selected={selectMode && selectedIds.includes(entry.id)}
                onToggleSelect={toggleSelect}
                onSubgenreClick={filterBySubgenre}
              />
            ))}
          </ul>
          {hasMore && <div ref={sentinelRef} className="vault-grid-sentinel" aria-hidden="true" />}
        </>
      )}

      {selectMode && (
        <div className="vault-bulk-bar" role="region" aria-label="Bulk actions">
          <span className="vault-bulk-count" aria-live="polite">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select films to copy'}
          </span>
          {selectedIds.length > 0 && (
            <button type="button" className="vault-bulk-text-btn" onClick={() => setSelectedIds([])}>
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={handleBatchCopy}
            className="btn-primary vault-bulk-copy"
            disabled={selectedIds.length === 0}
          >
            <Copy size={16} aria-hidden="true" />
            Copy<span className="vault-bulk-copy-more"> summaries</span>
          </button>
          <button type="button" className="vault-bulk-text-btn" onClick={toggleSelectMode}>
            Done
          </button>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
