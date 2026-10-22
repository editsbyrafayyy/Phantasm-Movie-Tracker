'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { Entry } from '@/lib/types';
import { Planchette } from '@/components/ui/HorrorIcons';

// Lazy-load the modal so it doesn't affect initial page load
const RouletteModal = dynamic(() => import('./RouletteModal'), { ssr: false });

interface RouletteTriggerProps {
  entries:   Entry[];
  canStream: boolean;
}

/**
 * Inline "Roulette" button for the home vault header, plus a compact floating
 * button on phones that only appears once the hero has scrolled away (so it
 * never covers the hero CTAs or the guest banner).
 * `?roulette=1` (from the R shortcut / command palette on other pages) opens it.
 */
export default function RouletteTrigger({ entries, canStream }: RouletteTriggerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  const requested = searchParams.get('roulette') === '1';
  const isOpen = open || requested;

  useEffect(() => {
    const hero = document.querySelector('.hero-carousel');
    if (!hero) return;
    const io = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), { threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  if (!entries.length) return null;

  function close() {
    setOpen(false);
    if (requested) router.replace(pathname, { scroll: false });
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary roulette-inline-btn"
        data-action="roulette"
        onClick={() => setOpen(true)}
      >
        <Planchette size={16} aria-hidden="true" />
        Roulette
      </button>

      <button
        type="button"
        className={`roulette-fab${pastHero && !isOpen ? ' is-visible' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open film roulette"
        tabIndex={pastHero ? 0 : -1}
        aria-hidden={pastHero ? undefined : true}
      >
        <Planchette size={20} aria-hidden="true" />
      </button>

      {isOpen && (
        <RouletteModal entries={entries} canStream={canStream} onClose={close} />
      )}
    </>
  );
}
