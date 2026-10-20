'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthProvider';

// Modal bodies load on first open so they stay out of every page's initial bundle.
const CommandPaletteModal    = dynamic(() => import('./CommandPaletteModal'), { ssr: false });
const KeyboardShortcutsModal = dynamic(() => import('./KeyboardShortcutsModal'), { ssr: false });

/** Opens roulette on the home page, or navigates there with a flag the trigger reads. */
export function openRoulette(push: (href: string) => void) {
  const trigger = document.querySelector<HTMLButtonElement>('[data-action="roulette"]');
  if (trigger) trigger.click();
  else push('/?roulette=1');
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/** Global keyboard shortcuts + the command palette and shortcuts help dialogs. */
export default function GlobalShortcuts() {
  const router = useRouter();
  const { user } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const shuffle = useCallback(() => openRoulette(href => router.push(href)), [router]);

  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    function onKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd+K works everywhere, including inside inputs.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setHelpOpen(false);
        setPaletteOpen(o => !o);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;

      if (e.key === '?') {
        e.preventDefault();
        setPaletteOpen(false);
        setHelpOpen(o => !o);
        return;
      }

      // Single-key shortcuts are inert while any dialog is open.
      if (document.querySelector('[role="dialog"]')) return;

      const key = e.key.toLowerCase();
      const now = Date.now();

      if (lastKey === 'g' && now - lastKeyTime < 800) {
        const dest: Record<string, string | undefined> = {
          h: '/',
          v: '/vault',
          d: user ? '/diary' : undefined,
          s: user ? '/profile' : undefined,
        };
        lastKey = '';
        if (dest[key]) {
          e.preventDefault();
          router.push(dest[key]);
        }
        return;
      }

      if (key === 'r') {
        e.preventDefault();
        openRoulette(href => router.push(href));
        return;
      }

      lastKey = key;
      lastKeyTime = now;
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router, user]);

  return (
    <>
      {paletteOpen && <CommandPaletteModal onClose={closePalette} onShuffle={shuffle} />}
      {helpOpen && <KeyboardShortcutsModal onClose={closeHelp} signedIn={!!user} />}
    </>
  );
}
