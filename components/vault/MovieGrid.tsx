'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Film, LayoutGrid, Grid, CheckSquare, Square, Copy, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/motion';
import MovieCard from './MovieCard';
import VaultFilters from './VaultFilters';
import type { Entry } from '@/lib/types';
import Toast from '@/components/ui/Toast';

import SubgenreDistributionBar from './SubgenreDistributionBar';

interface MovieGridProps {
  entries: Entry[];
}

export default function MovieGrid({ entries }: MovieGridProps) {
  const [filtered, setFiltered] = useState<Entry[]>(entries);
  // SSR-safe: initialize to default, read localStorage after mount
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  useEffect(() => {
    const saved = localStorage.getItem('vault_grid_density');
    if (saved === 'comfortable' || saved === 'compact') setDensity(saved);
  }, []);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);

  const handleFiltered = useCallback((result: Entry[]) => {
    setFiltered(result);
  }, []);

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  async function handleBatchCopy() {
    if (!selectedIds.length) return;
    const selectedEntries = entries.filter(e => selectedIds.includes(e.id));
    const text = selectedEntries
      .map(e => `${e.movie.title}${e.movie.year ? ` (${e.movie.year})` : ''} — ${e.total ?? '—'}/10`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: `Copied ${selectedIds.length} movie summaries!`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to copy summaries', type: 'error' });
    }
  }

  return (
    <div className="vault-content">
      {/* Subgenre makeup progress bar */}
      <SubgenreDistributionBar entries={entries} />

      {/* Grid controls bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button
          className="btn-edit"
          onClick={() => {
            setSelectMode(prev => !prev);
            if (selectMode) setSelectedIds([]);
          }}
          style={{ fontSize: 11, padding: '4px 10px', height: 30, display: 'inline-flex', alignItems: 'center', gap: 6, background: selectMode ? 'var(--red)' : 'transparent', color: selectMode ? '#fff' : 'var(--text-muted)' }}
        >
          {selectMode ? <CheckSquare size={13} /> : <Square size={13} />}
          {selectMode ? 'Exit Select Mode' : 'Bulk Select'}
        </button>

        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
          <button
            onClick={() => {
            setDensity('comfortable');
            localStorage.setItem('vault_grid_density', 'comfortable');
          }}
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
            onClick={() => {
            setDensity('compact');
            localStorage.setItem('vault_grid_density', 'compact');
          }}
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
              <Link href="/add" className="btn-primary vault-empty-cta">Add a Movie →</Link>
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
          {filtered.map((entry, idx) => {
            const isSelected = selectedIds.includes(entry.id);
            return (
              <div
                key={entry.id}
                style={{ position: 'relative' }}
                onClick={selectMode ? (e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(entry.id); } : undefined}
              >
                {selectMode && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 10,
                      background: isSelected ? 'var(--red)' : 'rgba(0,0,0,0.7)',
                      borderRadius: 4,
                      padding: 2,
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? <CheckSquare size={16} color="#fff" /> : <Square size={16} color="rgba(255,255,255,0.6)" />}
                  </div>
                )}
                <MovieCard entry={entry} priority={idx < 8} />
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectMode && selectedIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
            borderRadius: 30,
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {selectedIds.length} Selected
          </span>
          <button
            onClick={handleBatchCopy}
            className="btn-primary"
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, display: 'inline-flex', gap: 6, alignItems: 'center' }}
          >
            <Copy size={13} />
            Copy Summaries
          </button>
          <button
            onClick={() => setSelectedIds([])}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
