'use client';

import { useState, useEffect, useMemo } from 'react';
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const navItems = [
    { label: 'Go to The Vault', href: '/vault', icon: Film },
    { label: 'Go to Diary Feed', href: '/diary', icon: BookOpen },
    { label: 'Go to Statistics', href: '/stats', icon: BarChart2 },
    { label: 'Go to Watch Later Queue', href: '/watchlist', icon: Bookmark },
    { label: 'Browse Horror Catalog', href: '/browse', icon: Compass },
    { label: 'Add New Horror Entry', href: '/add', icon: Plus },
  ];

  function handleSelect(href: string) {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  }

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
          onClick={() => setIsOpen(false)}
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
                type="text"
                autoFocus
                className="form-input"
                placeholder="Type a command or search film titles..."
                value={query}
                onChange={e => setQuery(e.target.value)}
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
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Results & Actions List */}
            <div style={{ maxHeight: 380, overflowY: 'auto', padding: '10px 12px' }}>
              {/* Filtered Movie Results */}
              {filteredMovies.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', padding: '6px 10px', display: 'block' }}>
                    Matching Vault Films
                  </span>
                  {filteredMovies.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(`/vault/${item.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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
                  ))}
                </div>
              )}

              {/* Navigation Commands */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', padding: '6px 10px', display: 'block' }}>
                  Navigation & Shortcuts
                </span>
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Icon size={16} style={{ color: 'var(--text-muted)' }} />
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
              <span>Press <kbd style={{ background: 'var(--surface)', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>Esc</kbd> to close</span>
              <span><kbd style={{ background: 'var(--surface)', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>⌘K</kbd> / <kbd style={{ background: 'var(--surface)', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>Ctrl+K</kbd></span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
