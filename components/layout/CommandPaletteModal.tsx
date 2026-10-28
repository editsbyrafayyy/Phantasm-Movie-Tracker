'use client';

import { useState, useEffect, useMemo, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Film, BarChart2, Plus } from 'lucide-react';
import { HauntedHouse, Coffin, WatchingEye, Gravestone, Planchette, type IconComponent } from '@/components/ui/HorrorIcons';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/components/layout/AuthProvider';
import type { Entry } from '@/lib/types';

interface CommandPaletteModalProps {
  onClose:   () => void;
  onShuffle: () => void;
}

interface PaletteItem {
  key:      string;
  label:    string;
  meta?:    string;
  icon:     IconComponent;
  run:      () => void;
}

// Owner vault is fetched once, the first time the palette opens, then reused.
let vaultCache: Entry[] | null = null;

export default function CommandPaletteModal({ onClose, onShuffle }: CommandPaletteModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>(() => vaultCache ?? []);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const inputId = useId();

  useEffect(() => {
    if (vaultCache) return;
    const ctrl = new AbortController();
    fetch('/api/owner-vault', { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (Array.isArray(data)) {
          vaultCache = data as Entry[];
          setEntries(vaultCache);
        }
      })
      .catch(() => { /* aborted or offline — palette still works for navigation */ });
    return () => ctrl.abort();
  }, []);

  const items = useMemo<PaletteItem[]>(() => {
    const go = (href: string) => () => { onClose(); router.push(href); };
    const q = query.trim().toLowerCase();

    const films: PaletteItem[] = q
      ? entries
          .filter(e => e.movie?.title?.toLowerCase().includes(q))
          .slice(0, 6)
          .map(e => ({
            key:   `film-${e.id}`,
            label: e.movie.title,
            meta:  [e.movie.year, e.total ? `${e.total}/10` : null].filter(Boolean).join(' · '),
            icon:  Film,
            run:   go(`/vault/${e.id}`),
          }))
      : [];

    const nav: PaletteItem[] = [
      { key: 'home',      label: 'Home',              icon: HauntedHouse, run: go('/') },
      { key: 'vault',     label: user ? 'My Vault' : 'Vault', icon: Coffin, run: go('/vault') },
      ...(user ? [
        { key: 'stream',  label: 'Stream',            icon: WatchingEye, run: go('/stream') },
        { key: 'watchlist', label: 'Watch Later',     icon: Gravestone, run: go('/watchlist') },
        { key: 'profile',   label: 'Profile & stats', icon: BarChart2, run: go('/profile') },
        { key: 'add',       label: 'Log a film',      icon: Plus,      run: go('/add') },
      ] : []),
      { key: 'shuffle',   label: 'Film roulette',     icon: Planchette, run: () => { onClose(); onShuffle(); } },
    ].filter(item => !q || item.label.toLowerCase().includes(q));

    return [...films, ...nav];
  }, [query, entries, user, router, onClose, onShuffle]);

  const filmCount = items.filter(i => i.key.startsWith('film-')).length;
  const safeIndex = items.length ? Math.min(activeIndex, items.length - 1) : -1;

  // Keep the highlighted row visible while arrowing through the list.
  useEffect(() => {
    if (safeIndex < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${safeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [safeIndex]);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (items.length ? (Math.min(i, items.length - 1) + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (items.length ? (Math.min(i, items.length - 1) - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter' && safeIndex >= 0) {
      e.preventDefault();
      items[safeIndex].run();
    }
  }

  const renderRow = (item: PaletteItem, index: number) => {
    const Icon = item.icon;
    const active = index === safeIndex;
    return (
      <button
        key={item.key}
        id={`${listId}-${index}`}
        type="button"
        role="option"
        aria-selected={active}
        tabIndex={-1}
        data-index={index}
        className={`palette-row${active ? ' is-active' : ''}`}
        onClick={item.run}
        onMouseMove={() => { if (!active) setActiveIndex(index); }}
      >
        <Icon size={16} aria-hidden="true" />
        <span className="palette-row-label">{item.label}</span>
        {item.meta && <span className="palette-row-meta">{item.meta}</span>}
      </button>
    );
  };

  return (
    <Modal onClose={onClose} size="md" className="palette-modal" hideClose labelledBy={`${inputId}-label`}>
      <div className="palette-search">
        <Search size={16} aria-hidden="true" />
        <label id={`${inputId}-label`} htmlFor={inputId} className="sr-only">Search films or jump to a page</label>
        <input
          id={inputId}
          data-autofocus
          type="text"
          className="palette-input"
          placeholder="Search films or jump to…"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
          onKeyDown={onInputKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={safeIndex >= 0 ? `${listId}-${safeIndex}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        <kbd className="palette-kbd">Esc</kbd>
      </div>

      <div ref={listRef} id={listId} role="listbox" aria-label="Results" className="palette-list">
        {filmCount > 0 && <p className="palette-group-label">Films</p>}
        {items.slice(0, filmCount).map((item, i) => renderRow(item, i))}
        {items.length > filmCount && <p className="palette-group-label">Go to</p>}
        {items.slice(filmCount).map((item, i) => renderRow(item, filmCount + i))}
        {items.length === 0 && <p className="palette-empty">No matches for &ldquo;{query}&rdquo;</p>}
      </div>

      <div className="palette-footer" aria-hidden="true">
        <span><kbd className="palette-kbd">↑</kbd><kbd className="palette-kbd">↓</kbd> navigate</span>
        <span><kbd className="palette-kbd">↵</kbd> open</span>
        <span><kbd className="palette-kbd">Ctrl K</kbd> toggle</span>
      </div>
    </Modal>
  );
}
