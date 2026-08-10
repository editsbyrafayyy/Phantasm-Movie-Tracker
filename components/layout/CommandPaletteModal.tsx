'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Film, BookOpen, BarChart2, Bookmark, Compass, Plus, Shuffle, X } from 'lucide-react';
import type { Entry } from '@/lib/types';

export default function CommandPaletteModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setActiveIndex(-1);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !loaded) {
      fetch('/api/owner-vault')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setEntries(data);
            setLoaded(true);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, loaded]);

  const filteredMovies = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return entries
      .filter(e => e.movie?.title?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query, entries]);

  const navItems = useMemo(() => [
    { label: 'Go to The Vault', href: '/vault', icon: Film },
    { label: 'Go to Diary Feed', href: '/diary', icon: BookOpen },
    { label: 'Go to Statistics', href: '/stats', icon: BarChart2 },
    { label: 'Go to Watch Later Queue', href: '/watchlist', icon: Bookmark },
    { label: 'Browse Horror Catalog', href: '/browse', icon: Compass },
    { label: 'Add New Horror Entry', href: '/add', icon: Plus },
    { label: 'Shuffle — Random Film', href: '__shuffle__', icon: Shuffle },
  ], []);

  // Build flat list of all selectable items for arrow-key nav
  const allItems = useMemo(() => {
    const movieItems = filteredMovies.map(e => ({ href: `/vault/${e.id}`, label: e.movie?.title ?? '' }));
    const navHrefs = navItems.map(i => ({ href: i.href, label: i.label }));
    return [...movieItems, ...navHrefs];
  }, [filteredMovies, navItems]);

  function handleSelect(href: string) {
    close();
    if (href === '__shuffle__') {
      // Try clicking the roulette trigger button
      const roulette = document.querySelector<HTMLButtonElement>('.roulette-trigger-btn');
      if (roulette) { roulette.click(); return; }
      // Fallback: go to vault
      router.push('/vault');
      return;
    }
    router.push(href);
  }

  function handleKeyNav(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(allItems[activeIndex].href);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-palette-item]');
      const el = items[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Cumulative index tracking across sections
  let itemCounter = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh',
          }}
          onClick={close}
        >
          <motion.div
            className="command-palette-card"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              width: '90%',
              maxWidth: 580,
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <Search size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                className="form-input"
                placeholder="Type a command or search film titles..."
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveIndex(-1); }}
                onKeyDown={handleKeyNav}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  fontSize: 15,
                  color: 'var(--text)',
                  outline: 'none',
                  boxShadow: 'none',
                  flex: 1,
                }}
              />
              <button
                onClick={close}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Results & Actions List */}
            <div ref={listRef} style={{ maxHeight: 380, overflowY: 'auto', padding: '10px 12px' }}>
              {/* Filtered Movie Results */}
              {filteredMovies.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', padding: '6px 10px', display: 'block' }}>
                    Matching Vault Films
                  </span>
                  {filteredMovies.map(item => {
                    const idx = itemCounter++;
                    const isActive = activeIndex === idx;
                    return (
                      <div
                        key={item.id}
                        data-palette-item
                        onClick={() => handleSelect(`/vault/${item.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          background: isActive ? 'var(--surface-2)' : 'transparent',
                        }}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseLeave={() => setActiveIndex(-1)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Film size={14} style={{ color: 'var(--red)' }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                            {item.movie?.title}
                          </span>
                          {item.movie?.year && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({item.movie.year})</span>
                          )}
                        </div>
                        {item.total !== null && item.total > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                            {item.total}/10
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation Commands */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', padding: '6px 10px', display: 'block' }}>
                  Navigation & Shortcuts
                </span>
                {navItems.map(item => {
                  const Icon = item.icon;
                  const idx = itemCounter++;
                  const isActive = activeIndex === idx;
                  return (
                    <div
                      key={item.href}
                      data-palette-item
                      onClick={() => handleSelect(item.href)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: isActive ? 'var(--surface-2)' : 'transparent',
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(-1)}
                    >
                      <Icon size={16} style={{ color: isActive ? 'var(--red)' : 'var(--text-muted)', transition: 'color 0.15s' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '10px 16px',
                background: 'var(--surface-2)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <kbd style={{ background: 'var(--surface)', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>↑↓</kbd>
                navigate
                <kbd style={{ background: 'var(--surface)', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)', marginLeft: 6 }}>↵</kbd>
                select
              </span>
              <span>
                <kbd style={{ background: 'var(--surface)', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>⌘K</kbd>
                {' / '}
                <kbd style={{ background: 'var(--surface)', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>Ctrl+K</kbd>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
