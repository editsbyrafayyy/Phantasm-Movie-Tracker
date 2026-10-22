'use client';

import { useEffect } from 'react';

const LINES = ['Come back…', 'It’s quiet without you…', 'Don’t leave me here…', 'Something moved…'];

/** Swaps the tab title while the tab is hidden; restores it on return. */
export default function TabAwayTitle() {
  useEffect(() => {
    let saved: string | null = null;
    const onVisibility = () => {
      if (document.hidden) {
        saved = document.title;
        document.title = LINES[Math.floor(Math.random() * LINES.length)];
      } else if (saved !== null) {
        document.title = saved;
        saved = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  return null;
}
