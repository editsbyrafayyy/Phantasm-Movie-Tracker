'use client';

import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { Entry } from '@/lib/types';

// Lazy-load the heavy modal so it doesn't affect initial page load
const RouletteModal = dynamic(() => import('./RouletteModal'), { ssr: false });

interface RouletteTriggerProps {
  entries:   Entry[];
  canStream: boolean;
}

export default function RouletteTrigger({ entries, canStream }: RouletteTriggerProps) {
  const [open, setOpen] = useState(false);

  if (!entries.length) return null;

  return (
    <>
      <button
        className="roulette-trigger-btn"
        onClick={() => setOpen(true)}
        aria-label="Open film roulette"
        title="Can't decide? Spin the roulette!"
      >
        <Shuffle size={15} />
        Roulette
      </button>

      {open && (
        <RouletteModal
          entries={entries}
          canStream={canStream}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
