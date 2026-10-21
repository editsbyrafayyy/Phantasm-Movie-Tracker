'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import Modal from '@/components/ui/Modal';
import { SUBGENRES, SUBGENRE_HEX } from '@/lib/config';
import type { VaultGridEntry } from '@/lib/types';
import { VERDICTS, VERDICT_LABEL, verdictColor } from './verdict';

// ── Filter model ──────────────────────────────────────────────────────────────

export type SortKey = 'recent' | 'top' | 'worst' | 'year_desc' | 'year_asc' | 'runtime_desc' | 'runtime_asc' | 'az' | 'za';
export type DecadeBucket = 'all' | '2020s' | '2010s' | '2000s' | '1990s' | '1980s' | 'pre1980';
export type RuntimeBucket = 'all' | 'under90' | '90to120' | 'over120';
export type RatingBucket = 'all' | 'rated' | 'unrated';

export interface VaultFilterState {
  search:   string;
  genre:    string | null;
  tag:      string | null;
  verdict:  string | null;
  decade:   DecadeBucket;
  runtime:  RuntimeBucket;
  rating:   RatingBucket;
  sort:     SortKey;
}

export const DEFAULT_FILTERS: VaultFilterState = {
  search: '', genre: null, tag: null, verdict: null,
  decade: 'all', runtime: 'all', rating: 'all', sort: 'recent',
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent',       label: 'Recently added' },
  { value: 'top',          label: 'Highest rated' },
  { value: 'worst',        label: 'Lowest rated' },
  { value: 'year_desc',    label: 'Newest release' },
  { value: 'year_asc',     label: 'Oldest release' },
  { value: 'runtime_desc', label: 'Longest' },
  { value: 'runtime_asc',  label: 'Shortest' },
  { value: 'az',           label: 'Title A–Z' },
  { value: 'za',           label: 'Title Z–A' },
];

const DECADE_OPTIONS: { value: Exclude<DecadeBucket, 'all'>; label: string }[] = [
  { value: '2020s', label: '2020s' },
  { value: '2010s', label: '2010s' },
  { value: '2000s', label: '2000s' },
  { value: '1990s', label: '1990s' },
  { value: '1980s', label: '1980s' },
  { value: 'pre1980', label: 'Pre-1980' },
];

const RUNTIME_OPTIONS: { value: Exclude<RuntimeBucket, 'all'>; label: string }[] = [
  { value: 'under90', label: 'Under 90 min' },
  { value: '90to120', label: '90–120 min' },
  { value: 'over120', label: 'Over 2 hours' },
];

const RATING_OPTIONS: { value: Exclude<RatingBucket, 'all'>; label: string }[] = [
  { value: 'rated',   label: 'Scored' },
  { value: 'unrated', label: 'Not scored' },
];

const shortGenre = (g: string) => g.replace(' Horror', '').replace(' (Non-Horror)', '');

function inDecade(y: number, d: DecadeBucket): boolean {
  switch (d) {
    case 'pre1980': return y < 1980;
    case '1980s':   return y >= 1980 && y < 1990;
    case '1990s':   return y >= 1990 && y < 2000;
    case '2000s':   return y >= 2000 && y < 2010;
    case '2010s':   return y >= 2010 && y < 2020;
    case '2020s':   return y >= 2020;
    default:        return true;
  }
}

function inRuntime(r: number, b: RuntimeBucket): boolean {
  if (b === 'under90') return r < 90;
  if (b === '90to120') return r >= 90 && r <= 120;
  if (b === 'over120') return r > 120;
  return true;
}

const byTitle = (a: VaultGridEntry, b: VaultGridEntry) =>
  (a.movie.title ?? '').localeCompare(b.movie.title ?? '', undefined, { sensitivity: 'base' });

/** Pure filter + sort. `search` should already be deferred by the caller. */
export function applyVaultFilters(entries: VaultGridEntry[], f: VaultFilterState): VaultGridEntry[] {
  const q = f.search.trim().toLowerCase();
  const tag = f.tag?.toLowerCase() ?? null;

  const result = entries.filter(e => {
    const m = e.movie;
    if (q) {
      const hit = m.title?.toLowerCase().includes(q)
        || m.director?.toLowerCase().includes(q)
        || m.cast_names.some(n => n.toLowerCase().includes(q));
      if (!hit) return false;
    }
    if (f.genre && e.subgenre !== f.genre) return false;
    if (tag && !(e.secondary_tag ?? '').toLowerCase().split(',').some(t => t.trim() === tag)) return false;
    if (f.verdict && e.recommend !== f.verdict) return false;
    if (f.rating === 'rated' && !(e.total !== null && e.total > 0)) return false;
    if (f.rating === 'unrated' && e.total !== null && e.total > 0) return false;
    if (f.decade !== 'all' && !(m.year && inDecade(m.year, f.decade))) return false;
    if (f.runtime !== 'all' && !(m.runtime_min && inRuntime(m.runtime_min, f.runtime))) return false;
    return true;
  });

  switch (f.sort) {
    case 'az':           result.sort(byTitle); break;
    case 'za':           result.sort((a, b) => byTitle(b, a)); break;
    case 'top':          result.sort((a, b) => (b.total ?? 0) - (a.total ?? 0)); break;
    case 'worst':        result.sort((a, b) => (a.total ?? 0) - (b.total ?? 0)); break;
    case 'year_desc':    result.sort((a, b) => (b.movie.year ?? 0) - (a.movie.year ?? 0)); break;
    case 'year_asc':     result.sort((a, b) => (a.movie.year ?? 0) - (b.movie.year ?? 0)); break;
    case 'runtime_desc': result.sort((a, b) => (b.movie.runtime_min ?? 0) - (a.movie.runtime_min ?? 0)); break;
    case 'runtime_asc':  result.sort((a, b) => (a.movie.runtime_min ?? 0) - (b.movie.runtime_min ?? 0)); break;
    case 'recent':       result.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0)); break;
  }
  return result;
}

interface ActiveChip { key: string; label: string; clear: Partial<VaultFilterState>; }

function activeChips(f: VaultFilterState): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (f.genre)   chips.push({ key: 'genre', label: shortGenre(f.genre), clear: { genre: null } });
  if (f.tag)     chips.push({ key: 'tag', label: `#${f.tag}`, clear: { tag: null } });
  if (f.verdict) chips.push({ key: 'verdict', label: VERDICT_LABEL[f.verdict] ?? f.verdict, clear: { verdict: null } });
  if (f.decade !== 'all')  chips.push({ key: 'decade', label: DECADE_OPTIONS.find(o => o.value === f.decade)?.label ?? f.decade, clear: { decade: 'all' } });
  if (f.runtime !== 'all') chips.push({ key: 'runtime', label: RUNTIME_OPTIONS.find(o => o.value === f.runtime)?.label ?? f.runtime, clear: { runtime: 'all' } });
  if (f.rating !== 'all')  chips.push({ key: 'rating', label: RATING_OPTIONS.find(o => o.value === f.rating)?.label ?? f.rating, clear: { rating: 'all' } });
  return chips;
}

// ── Responsive helper ─────────────────────────────────────────────────────────

const PHONE_QUERY = '(max-width: 640px)';
function subscribePhone(cb: () => void) {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function useIsPhone(): boolean {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);
}

// ── Filter panel (shared by desktop popover + mobile sheet) ──────────────────

interface FilterPanelProps {
  filters:  VaultFilterState;
  onChange: (patch: Partial<VaultFilterState>) => void;
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="vault-filter-group">
      <legend className="vault-filter-legend">{label}</legend>
      <div className="vault-filter-chips">{children}</div>
    </fieldset>
  );
}

function FilterPanel({ filters, onChange }: FilterPanelProps) {
  return (
    <div className="vault-filter-panel-body">
      <FilterGroup label="Verdict">
        {VERDICTS.map(v => (
          <button
            key={v}
            type="button"
            className="chip"
            aria-pressed={filters.verdict === v}
            onClick={() => onChange({ verdict: filters.verdict === v ? null : v })}
          >
            <span className="vault-dot" style={{ background: verdictColor(v) }} aria-hidden="true" />
            {VERDICT_LABEL[v]}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup label="Subgenre">
        {SUBGENRES.map(g => (
          <button
            key={g}
            type="button"
            className="chip"
            aria-pressed={filters.genre === g}
            onClick={() => onChange({ genre: filters.genre === g ? null : g })}
          >
            <span className="vault-dot" style={{ background: SUBGENRE_HEX[g] }} aria-hidden="true" />
            {shortGenre(g)}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup label="Decade">
        {DECADE_OPTIONS.map(o => (
          <button
            key={o.value}
            type="button"
            className="chip"
            aria-pressed={filters.decade === o.value}
            onClick={() => onChange({ decade: filters.decade === o.value ? 'all' : o.value })}
          >
            {o.label}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup label="Runtime">
        {RUNTIME_OPTIONS.map(o => (
          <button
            key={o.value}
            type="button"
            className="chip"
            aria-pressed={filters.runtime === o.value}
            onClick={() => onChange({ runtime: filters.runtime === o.value ? 'all' : o.value })}
          >
            {o.label}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup label="Score">
        {RATING_OPTIONS.map(o => (
          <button
            key={o.value}
            type="button"
            className="chip"
            aria-pressed={filters.rating === o.value}
            onClick={() => onChange({ rating: filters.rating === o.value ? 'all' : o.value })}
          >
            {o.label}
          </button>
        ))}
      </FilterGroup>
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

interface VaultFiltersProps {
  filters:     VaultFilterState;
  onChange:    (patch: Partial<VaultFilterState>) => void;
  onClearAll:  () => void;
  resultCount: number;
  totalCount:  number;
  /** Compact secondary controls (density, bulk select) rendered at the end of the toolbar. */
  actions?:    ReactNode;
}

export default function VaultFilters({ filters, onChange, onClearAll, resultCount, totalCount, actions }: VaultFiltersProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const isPhone = useIsPhone();
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const chips = activeChips(filters);
  // Text search is not counted in the Filters badge — it has its own field.
  const filterCount = chips.length;
  const hasAnyFilter = filterCount > 0 || filters.search.trim() !== '';

  // Desktop popover: close on outside click / Escape.
  useEffect(() => {
    if (!panelOpen || isPhone) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setPanelOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setPanelOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [panelOpen, isPhone]);

  return (
    <div className="vault-toolbar">
      <div className="vault-toolbar-row">
        <div className="vault-search-wrap">
          <Search size={16} className="vault-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="vault-search"
            placeholder="Search title, director, cast"
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            aria-label="Search your vault"
          />
          {filters.search && (
            <button
              type="button"
              className="vault-search-clear"
              onClick={() => onChange({ search: '' })}
              aria-label="Clear search"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="vault-toolbar-controls">
          <div className="vault-sort">
            <CustomSelect
              value={filters.sort}
              options={SORT_OPTIONS}
              onChange={val => onChange({ sort: val as SortKey })}
              ariaLabel="Sort films"
              align="right"
            />
          </div>

          <div className="vault-filters-anchor">
            <button
              ref={triggerRef}
              type="button"
              className={`btn-secondary vault-filters-trigger${filterCount > 0 ? ' is-active' : ''}`}
              aria-expanded={panelOpen}
              aria-haspopup="dialog"
              aria-label={filterCount > 0 ? `Filters, ${filterCount} active` : 'Filters'}
              onClick={() => setPanelOpen(o => !o)}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              <span>Filters</span>
              {filterCount > 0 && <span className="vault-filters-count" aria-hidden="true">{filterCount}</span>}
            </button>

            {panelOpen && !isPhone && (
              <div ref={popoverRef} className="vault-filter-popover" role="dialog" aria-label="Filter films">
                <FilterPanel filters={filters} onChange={onChange} />
                <div className="vault-filter-popover-foot">
                  <button type="button" className="vault-clear-link" onClick={onClearAll} disabled={!hasAnyFilter}>
                    Clear all
                  </button>
                  <span className="vault-result-count">{resultCount} of {totalCount}</span>
                </div>
              </div>
            )}
          </div>

          {actions}
        </div>
      </div>

      {(chips.length > 0 || hasAnyFilter) && (
        <div className="vault-active-row" aria-live="polite">
          <span className="vault-result-count">
            {resultCount} of {totalCount}
          </span>
          {chips.map(c => (
            <button
              key={c.key}
              type="button"
              className="chip is-active vault-active-chip"
              onClick={() => onChange(c.clear)}
              aria-label={`Remove filter: ${c.label}`}
            >
              {c.label}
              <X size={14} aria-hidden="true" />
            </button>
          ))}
          <button type="button" className="vault-clear-link" onClick={onClearAll}>
            Clear all
          </button>
        </div>
      )}

      {panelOpen && isPhone && (
        <Modal title="Filters" onClose={() => setPanelOpen(false)} className="vault-filter-sheet">
          <FilterPanel filters={filters} onChange={onChange} />
          <div className="vault-filter-sheet-foot">
            <button type="button" className="btn-secondary" onClick={onClearAll} disabled={!hasAnyFilter}>
              Clear all
            </button>
            <button type="button" className="btn-primary" onClick={() => setPanelOpen(false)}>
              Show {resultCount} film{resultCount === 1 ? '' : 's'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
