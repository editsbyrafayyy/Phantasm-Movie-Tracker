'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, RotateCcw, Film } from 'lucide-react';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';

interface Mood {
  id:          string;
  label:       string;
  description: string;
  accent:      string;
  params: {
    sort_by?:              string;
    'vote_average.gte'?:   number;
    'vote_average.lte'?:   number;
    'vote_count.gte'?:     number;
    'vote_count.lte'?:     number;
    'with_runtime.lte'?:   number;
    'with_runtime.gte'?:   number;
    'primary_release_date.lte'?: string;
    'primary_release_date.gte'?: string;
    with_keywords?:        string;
  };
}

const MOODS: Mood[] = [
  {
    id: 'terrifying',
    label: 'Terrify Me',
    description: 'Critically acclaimed, highly rated horror masterpieces that deliver maximum scares.',
    accent: '#e63232',
    params: {},
  },
  {
    id: 'psychological',
    label: 'Mess With My Head',
    description: 'Psychological horror and mind-benders that will keep you guessing and questioning reality.',
    accent: '#9b59f5',
    params: {},
  },
  {
    id: 'quick',
    label: 'Quick Watch',
    description: 'Fast-paced, high-intensity horror flicks clocking in under 95 minutes for a quick thrill.',
    accent: '#f5c518',
    params: {},
  },
  {
    id: 'classic',
    label: 'Old School',
    description: 'Nostalgic classics and vintage horror masterpieces released in 1999 or earlier.',
    accent: '#a89070',
    params: {},
  },
  {
    id: 'recent',
    label: 'Fresh Nightmare',
    description: 'The latest chilling releases and modern nightmares from the last two years.',
    accent: '#52b044',
    params: {},
  },
  {
    id: 'hidden',
    label: 'Hidden Gem',
    description: 'Underrated sleeper hits and lesser-known horror movies rated 6.5 to 7.5.',
    accent: '#3b82f6',
    params: {},
  },
  {
    id: 'popular',
    label: "Everyone's Watching",
    description: 'Highly rated horror movies with a massive following and high popularity ratings.',
    accent: '#ff6b35',
    params: {},
  },
  {
    id: 'extreme',
    label: 'Stomach of Steel',
    description: 'Visceral gore, body horror, and intense films that will test the limits of your stomach.',
    accent: '#6b6b6b',
    params: {},
  },
];

export default function MoodPicker() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Mood | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [allMoodData, setAllMoodData] = useState<Record<string, any[]>>({});
  const [initialLoading, setInitialLoading] = useState(false);

  // Pre-fetch all mood categories when the panel is toggled open
  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && Object.keys(allMoodData).length === 0 && !initialLoading) {
      setInitialLoading(true);
      try {
        const res = await fetch('/api/stream/moods');
        if (res.ok) {
          const data = await res.json();
          setAllMoodData(data);
          // If a mood is already selected (e.g. user clicked chip quickly), update results
          if (selected) {
            setResults(data[selected.id] ?? []);
            setFetched(true);
          }
        }
      } catch (err) {
        console.error('Failed to pre-fetch mood recommendations:', err);
      } finally {
        setInitialLoading(false);
      }
    }
  };

  async function pickMood(mood: Mood) {
    setSelected(mood);
    setLoading(true);
    setFetched(false);

    // If pre-fetched cache has data, use it instantly
    if (Object.keys(allMoodData).length > 0) {
      setResults(allMoodData[mood.id] ?? []);
      setLoading(false);
      setFetched(true);
      return;
    }

    // Fallback if data is not loaded yet (clicked chip before prefetch finished)
    setInitialLoading(true);
    try {
      const res = await fetch('/api/stream/moods');
      if (res.ok) {
        const data = await res.json();
        setAllMoodData(data);
        setResults(data[mood.id] ?? []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setInitialLoading(false);
      setLoading(false);
      setFetched(true);
    }
  }

  function reset() {
    setSelected(null);
    setResults([]);
    setFetched(false);
  }

  return (
    <div className="mood-picker-wrapper">
      <button
        className={`mood-toggle-btn${open ? ' open' : ''}`}
        onClick={handleToggle}
        aria-expanded={open}
      >
        <Sparkles size={15} />
        <span>Pick by Mood</span>
        <ChevronDown size={14} className={`mood-chevron${open ? ' rotated' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mood-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mood-panel-inner">
              <p className="mood-heading">How do you want to feel tonight?</p>

              <div className="mood-chip-grid">
                {MOODS.map(mood => (
                  <button
                    key={mood.id}
                    className={`mood-chip${selected?.id === mood.id ? ' active' : ''}`}
                    onClick={() => pickMood(mood)}
                    disabled={loading}
                    style={selected?.id === mood.id ? { borderColor: mood.accent } : {}}
                  >
                    <span
                      className="mood-chip-accent-dot"
                      style={{ background: mood.accent }}
                    />
                    <span className="mood-chip-label">{mood.label}</span>
                    <span className="mood-chip-desc">{mood.description}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {(loading || initialLoading) && (
                  <motion.div
                    key="loading"
                    className="mood-results-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="skeleton mood-skeleton" style={{ animationDelay: `${i * 60}ms` }} />
                    ))}
                  </motion.div>
                )}

                {fetched && !loading && !initialLoading && results.length > 0 && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="mood-results-header">
                      <span className="mood-results-label">
                        {selected?.label} — {results.length} picks
                      </span>
                      <button className="mood-reset-btn" onClick={reset}>
                        <RotateCcw size={12} /> Clear
                      </button>
                    </div>
                    <div className="mood-results-grid">
                      {results.map(film => (
                        <Link
                          key={film.id}
                          href={`/stream/tmdb/${film.id}?type=movie&from=${encodeURIComponent(pathname)}`}
                          className="mood-result-card"
                        >
                          <div className="mood-result-poster">
                            {film.poster_path ? (
                              <Image
                                src={film.poster_path.startsWith('http') ? film.poster_path : `https://image.tmdb.org/t/p/w342${film.poster_path}`}
                                alt={film.title ?? film.name ?? ''}
                                fill
                                sizes="(max-width: 640px) 40vw, 120px"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="mood-result-fallback">
                                <Film size={20} opacity={0.3} />
                              </div>
                            )}
                            {film.vote_average > 0 && (
                              <span className="mood-result-rating">
                                {film.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <p className="mood-result-title">{film.title ?? film.name}</p>
                          <p className="mood-result-year">
                            {(film.release_date ?? film.first_air_date ?? '').slice(0, 4)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}

                {fetched && !loading && !initialLoading && results.length === 0 && (
                  <motion.p
                    key="empty"
                    className="mood-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    No results for this mood right now. Try another!
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
