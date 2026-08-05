'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, X, Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['?'], description: 'Toggle this keyboard shortcuts menu' },
  { keys: ['R'], description: 'Open Movie Roulette' },
  { keys: ['G', 'V'], description: 'Go to Vault' },
  { keys: ['G', 'D'], description: 'Go to Diary' },
  { keys: ['G', 'S'], description: 'Go to Stats' },
  { keys: ['Esc'], description: 'Close active modal / overlay' },
];

export default function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing inside inputs, textareas, or contentEditable elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // '?' key (Shift + / or ?)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setOpen(prev => !prev);
        return;
      }

      // 'Esc' key to close modal if open
      if (e.key === 'Escape' && open) {
        setOpen(false);
        return;
      }

      // 'R' key for Roulette (dispatch custom event if listener exists)
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) {
        const rouletteBtn = document.querySelector<HTMLButtonElement>('[aria-label="Movie Roulette"], .roulette-btn, button:contains("Roulette")');
        if (rouletteBtn) {
          rouletteBtn.click();
        }
      }

      // Sequential shortcuts ('G' then 'V', 'G' then 'D', 'G' then 'S')
      const now = Date.now();
      const currentKey = e.key.toLowerCase();

      if (lastKey === 'g' && now - lastKeyTime < 800) {
        if (currentKey === 'v') {
          e.preventDefault();
          router.push('/vault');
        } else if (currentKey === 'd') {
          e.preventDefault();
          router.push('/diary');
        } else if (currentKey === 's') {
          e.preventDefault();
          router.push('/stats');
        }
        lastKey = '';
      } else {
        lastKey = currentKey;
        lastKeyTime = now;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, router]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="share-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={e => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          style={{ zIndex: 999 }}
        >
          <motion.div
            className="share-panel"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ maxWidth: 420 }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
                paddingBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Keyboard size={18} style={{ color: 'var(--red)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                }}
                aria-label="Close shortcuts modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
              {SHORTCUTS.map(sc => (
                <div
                  key={sc.description}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                    {sc.description}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {sc.keys.map(k => (
                      <kbd
                        key={k}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'var(--font-sans)',
                          color: 'var(--text)',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '3px 7px',
                          minWidth: 22,
                          textAlign: 'center',
                          boxShadow: '0 2px 0 rgba(0,0,0,0.3)',
                        }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              Press <kbd style={{ fontSize: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 4 }}>?</kbd> anytime to open or close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
