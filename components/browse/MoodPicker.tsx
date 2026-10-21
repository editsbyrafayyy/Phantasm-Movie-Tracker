'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

interface Mood {
  id:          string;
  label:       string;
  description: string;
}

const MOODS: Mood[] = [
  { id: 'terrifying',    label: 'Terrify Me',          description: 'Highly rated horror with the strongest reviews.' },
  { id: 'psychological', label: 'Mess With My Head',   description: 'Psychological horror and mind-benders.' },
  { id: 'quick',         label: 'Quick Watch',         description: 'Horror under 95 minutes.' },
  { id: 'classic',       label: 'Old School',          description: 'Horror released in 1999 or earlier.' },
  { id: 'recent',        label: 'Fresh Nightmare',     description: 'Horror from the last two years.' },
  { id: 'hidden',        label: 'Hidden Gem',          description: 'Lesser-known horror rated 6.5 to 7.5.' },
  { id: 'popular',       label: "Everyone's Watching", description: 'Well-rated horror with the biggest audiences right now.' },
  { id: 'extreme',       label: 'Stomach of Steel',    description: 'Gore, body horror and the hardest films to sit through.' },
];

type MoodData = Record<string, TmdbDiscoverMovie[]>;

// ── Shared, de-duplicated fetch of every mood's picks ─────────────────────────
// The trigger prefetches on open and chip clicks await the same promise, so a
// click during prefetch never fires a second /api/stream/moods request.
let moodCache: MoodData | null = null;
let moodPromise: Promise<MoodData> | null = null;

export function loadMoods(): Promise<MoodData> {
  if (moodCache) return Promise.resolve(moodCache);
  if (!moodPromise) {
    moodPromise = fetch('/api/stream/moods')
      .then(res => {
        if (!res.ok) throw new Error(`moods ${res.status}`);
        return res.json() as Promise<MoodData>;
      })
      .then(data => { moodCache = data ?? {}; return moodCache; })
      .finally(() => { moodPromise = null; });
  }
  return moodPromise;
}

/** Toolbar button that opens the mood panel. Pair with <MoodPanel id={controlsId}>. */
export function MoodPickerTrigger({ open, onToggle, controlsId }: { open: boolean; onToggle: () => void; controlsId: string }) {
  return (
    <button
      type="button"
      className={`btn-secondary mood-trigger${open ? ' is-active' : ''}`}
      onClick={() => {
        if (!open) loadMoods().catch(() => { /* surfaced when a mood is picked */ });
        onToggle();
      }}
      aria-expanded={open}
      aria-controls={controlsId}
    >
      <SlidersHorizontal size={16} aria-hidden="true" />
      <span>Pick by mood</span>
      <ChevronDown size={16} aria-hidden="true" className={`mood-chevron${open ? ' rotated' : ''}`} />
    </button>
  );
}

interface MoodPanelProps {
  id:      string;
  open:    boolean;
  onClose: () => void;
}

/** Inline, labelled panel of mood chips + results. Stays mounted so picks survive close/reopen. */
export default function MoodPanel({ id, open, onClose }: MoodPanelProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [data, setData]             = useState<MoodData | null>(() => moodCache);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus]         = useState<'idle' | 'loading' | 'error'>('idle');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function pickMood(moodId: string) {
    setSelectedId(moodId);
    const ready = data ?? moodCache;
    if (ready) {
      if (!data) setData(ready);
      return;
    }
    setStatus('loading');
    try {
      const result = await loadMoods();
      if (!mountedRef.current) return;
      setData(result);
      setStatus('idle');
    } catch {
      if (mountedRef.current) setStatus('error');
    }
  }

  const selected = MOODS.find(m => m.id === selectedId) ?? null;
  const results  = selected && data ? data[selected.id] ?? [] : [];
  const headingId = `${id}-heading`;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.section
          id={id}
          className="mood-panel"
          role="region"
          aria-labelledby={headingId}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mood-panel-inner">
            <div className="mood-panel-head">
              <h2 id={headingId} className="mood-heading">How do you want to feel tonight?</h2>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close mood picker">
                <X size={16} />
              </button>
            </div>

            <div className="mood-chip-grid" role="group" aria-label="Moods">
              {MOODS.map(mood => (
                <button
                  key={mood.id}
                  type="button"
                  className="mood-chip"
                  aria-pressed={selectedId === mood.id}
                  onClick={() => pickMood(mood.id)}
                >
                  <span className="mood-chip-label">{mood.label}</span>
                  <span className="mood-chip-desc">{mood.description}</span>
                </button>
              ))}
            </div>

            <div aria-live="polite" aria-busy={status === 'loading'}>
              {status === 'loading' && (
                <div className="mood-results-loading">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton mood-skeleton" style={{ animationDelay: `${i * 60}ms` }} />
                  ))}
                </div>
              )}

              {status === 'error' && (
                <div className="mood-empty">
                  <p>Couldn’t load mood picks.</p>
                  <button type="button" className="btn-secondary" onClick={() => selectedId && pickMood(selectedId)}>
                    Try again
                  </button>
                </div>
              )}

              {status === 'idle' && selected && data && results.length > 0 && (
                <div>
                  <div className="mood-results-header">
                    <span className="mood-results-label">
                      {selected.label} — {results.length} picks
                    </span>
                    <button type="button" className="btn-ghost mood-reset-btn" onClick={() => setSelectedId(null)}>
                      Clear
                    </button>
                  </div>
                  <div className="mood-results-grid">
                    {results.map(film => {
                      const name = film.title ?? film.name ?? '';
                      return (
                        <Link
                          key={film.id}
                          href={`/stream/tmdb/${film.id}?type=movie&from=${encodeURIComponent(pathname)}`}
                          className="mood-result-card"
                        >
                          <div className="mood-result-poster">
                            {film.poster_path ? (
                              <Image
                                src={film.poster_path.startsWith('http') ? film.poster_path : `https://image.tmdb.org/t/p/w342${film.poster_path}`}
                                alt={name}
                                fill
                                sizes="(max-width: 640px) 40vw, 120px"
                                className="browse-card-img"
                              />
                            ) : (
                              <div className="mood-result-fallback" aria-hidden="true">{name.charAt(0).toUpperCase()}</div>
                            )}
                            {film.vote_average > 0 && (
                              <span className="mood-result-rating">{film.vote_average.toFixed(1)}</span>
                            )}
                          </div>
                          <p className="mood-result-title">{name}</p>
                          <p className="mood-result-year">
                            {(film.release_date ?? film.first_air_date ?? '').slice(0, 4)}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {status === 'idle' && selected && data && results.length === 0 && (
                <p className="mood-empty">No picks for this mood right now. Try another.</p>
              )}
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
