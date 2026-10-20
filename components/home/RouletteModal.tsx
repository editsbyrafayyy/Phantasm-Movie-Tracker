'use client';

import { useState, useEffect, useRef, useId } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shuffle, Play, RotateCcw, Film } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Entry } from '@/lib/types';
import { SUBGENRES } from '@/lib/config';

interface RouletteModalProps {
  entries:   Entry[];
  canStream: boolean;
  onClose:   () => void;
}

type DecadeFilter = 'Any' | 'Pre-70s' | '70s' | '80s' | '90s' | '00s' | '10s' | '20s';
type RuntimeFilter = 'Any' | 'Under 90 min' | '90–120 min' | 'Over 120 min';

const DECADE_RANGES: Record<DecadeFilter, [number, number] | null> = {
  'Any':     null,
  'Pre-70s': [1900, 1969],
  '70s':     [1970, 1979],
  '80s':     [1980, 1989],
  '90s':     [1990, 1999],
  '00s':     [2000, 2009],
  '10s':     [2010, 2019],
  '20s':     [2020, 2029],
};

const RUNTIME_RANGES: Record<RuntimeFilter, [number, number] | null> = {
  'Any':          null,
  'Under 90 min': [0,   89],
  '90–120 min':   [90,  120],
  'Over 120 min': [121, 9999],
};

function filterEntries(
  entries: Entry[],
  subgenre: string,
  decade: DecadeFilter,
  runtime: RuntimeFilter,
  recommend: string,
  unwatchedOnly: boolean,
): Entry[] {
  return entries.filter(e => {
    if (unwatchedOnly && (e.total !== null && e.total > 0)) return false;
    if (subgenre !== 'Any' && e.subgenre !== subgenre) return false;
    if (recommend !== 'Any' && e.recommend !== recommend) return false;
    const dRange = DECADE_RANGES[decade];
    if (dRange && e.movie.year) {
      if (e.movie.year < dRange[0] || e.movie.year > dRange[1]) return false;
    }
    const rRange = RUNTIME_RANGES[runtime];
    if (rRange && e.movie.runtime_min) {
      if (e.movie.runtime_min < rRange[0] || e.movie.runtime_min > rRange[1]) return false;
    }
    return true;
  });
}

export default function RouletteModal({ entries, canStream, onClose }: RouletteModalProps) {
  const [subgenre,      setSubgenre]      = useState<string>('Any');
  const [decade,        setDecade]        = useState<DecadeFilter>('Any');
  const [runtime,       setRuntime]       = useState<RuntimeFilter>('Any');
  const [recommend,     setRecommend]     = useState<string>('Any');
  const [unwatchedOnly, setUnwatchedOnly] = useState<boolean>(false);

  const [spinning, setSpinning]   = useState(false);
  const [result,   setResult]     = useState<Entry | null>(null);
  // Posters flashed during the spin — picked in the click handler, not during render.
  const [glitchFrames, setGlitchFrames] = useState<Entry[] | null>(null);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();

  useEffect(() => () => { if (spinTimer.current) clearTimeout(spinTimer.current); }, []);

  const pool = filterEntries(entries, subgenre, decade, runtime, recommend, unwatchedOnly);
  const hasPool = pool.length > 0;
  const glitch = glitchFrames !== null;

  function spin() {
    if (!pool.length) return;
    const randomPick = () => pool[Math.floor(Math.random() * pool.length)];

    setSpinning(true);
    setResult(null);
    setGlitchFrames(Array.from({ length: 6 }, randomPick));

    // Horror glitch effect: rapid flashing then settle on a result
    if (spinTimer.current) clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => {
      setGlitchFrames(null);
      setResult(randomPick());
      setSpinning(false);
    }, 900);
  }

  return (
    <Modal onClose={onClose} labelledBy={titleId} hideClose size="md" className="roulette-modal">
          {/* Header */}
          <div className="roulette-header">
            <div className="roulette-header-left">
              <span className="roulette-eyebrow">Film roulette</span>
              <h2 id={titleId} className="roulette-title">Can&apos;t decide?</h2>
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close roulette">
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Filters */}
          <div className="roulette-filters">
            {/* Subgenre */}
            <div className="roulette-filter-group">
              <span className="roulette-filter-label">Genre</span>
              <div className="roulette-chip-row">
                {['Any', ...SUBGENRES].map(s => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={subgenre === s}
                    className={`roulette-chip${subgenre === s ? ' active' : ''}`}
                    onClick={() => setSubgenre(s)}
                  >{s === 'Any' ? 'Any' : s.replace(' Horror', '').replace(' (Non-Horror)', '')}</button>
                ))}
              </div>
            </div>

            {/* Recommend */}
            <div className="roulette-filter-group">
              <span className="roulette-filter-label">Rating Tier</span>
              <div className="roulette-chip-row">
                {['Any', 'Peak', 'Yes', 'No', 'Garbage'].map(r => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={recommend === r}
                    className={`roulette-chip${recommend === r ? ' active' : ''}`}
                    onClick={() => setRecommend(r)}
                  >{r}</button>
                ))}
              </div>
            </div>

            {/* Runtime */}
            <div className="roulette-filter-group">
              <span className="roulette-filter-label">Runtime</span>
              <div className="roulette-chip-row">
                {(Object.keys(RUNTIME_RANGES) as RuntimeFilter[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={runtime === r}
                    className={`roulette-chip${runtime === r ? ' active' : ''}`}
                    onClick={() => setRuntime(r)}
                  >{r}</button>
                ))}
              </div>
            </div>

            {/* Decade */}
            <div className="roulette-filter-group">
              <span className="roulette-filter-label">Decade</span>
              <div className="roulette-chip-row">
                {(Object.keys(DECADE_RANGES) as DecadeFilter[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={decade === d}
                    className={`roulette-chip${decade === d ? ' active' : ''}`}
                    onClick={() => setDecade(d)}
                  >{d}</button>
                ))}
              </div>
            </div>

            {/* Unwatched Filter */}
            <div className="roulette-filter-group">
              <span className="roulette-filter-label">Watch Status</span>
              <div className="roulette-chip-row">
                <button
                  type="button"
                  aria-pressed={!unwatchedOnly}
                  className={`roulette-chip${!unwatchedOnly ? ' active' : ''}`}
                  onClick={() => setUnwatchedOnly(false)}
                >
                  All Films
                </button>
                <button
                  type="button"
                  aria-pressed={unwatchedOnly}
                  className={`roulette-chip${unwatchedOnly ? ' active' : ''}`}
                  onClick={() => setUnwatchedOnly(true)}
                >
                  Unwatched Only
                </button>
              </div>
            </div>
          </div>

          {/* Pool count */}
          <p className="roulette-pool-count" aria-live="polite">
            {hasPool
              ? `${pool.length} film${pool.length === 1 ? '' : 's'} in pool`
              : 'No films match — adjust filters'}
          </p>

          {/* Result area */}
          <div className="roulette-result-area">
            <AnimatePresence mode="wait">
              {glitch && (
                <motion.div
                  key="glitch"
                  className="roulette-glitch"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {glitchFrames?.map((fake, i) => (
                    <div key={i} className="roulette-glitch-frame">
                      {fake.movie.poster_url && (
                        <Image src={fake.movie.poster_url} alt="" fill style={{ objectFit: 'cover' }} sizes="140px" />
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

              {result && !spinning && (
                <motion.div
                  key="result"
                  className="roulette-result-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="roulette-result-poster">
                    {result.movie.poster_url ? (
                      <Image
                        src={result.movie.poster_url}
                        alt={result.movie.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="140px"
                      />
                    ) : (
                      <div className="roulette-poster-fallback"><Film size={32} aria-hidden="true" /></div>
                    )}
                  </div>
                  <div className="roulette-result-info">
                    <h3 className="roulette-result-title">{result.movie.title}</h3>
                    <div className="roulette-result-meta">
                      {result.movie.year && <span>{result.movie.year}</span>}
                      {result.movie.runtime_min && <span>{result.movie.runtime_min} min</span>}
                      {result.subgenre && <span>{result.subgenre}</span>}
                    </div>
                    <div className="roulette-result-score">
                      <span className="roulette-score-val">{result.total}</span>
                      <span className="roulette-score-denom">/ 10</span>
                      {result.recommend && (
                        <span className={`roulette-recommend roulette-recommend--${result.recommend.toLowerCase()}`}>
                          {result.recommend}
                        </span>
                      )}
                    </div>
                    <div className="roulette-result-actions">
                      {canStream && (result.movie.omdb_id || result.movie.tmdb_id) && (
                        <Link
                          href={`/stream/${result.movie.omdb_id || result.movie.tmdb_id}`}
                          className="roulette-btn-watch"
                          onClick={onClose}
                        >
                          <Play size={14} fill="currentColor" aria-hidden="true" /> Watch now
                        </Link>
                      )}
                      <Link
                        href={`/vault/${result.id}`}
                        className="roulette-btn-detail"
                        onClick={onClose}
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              {!glitch && !result && (
                <motion.div
                  key="idle"
                  className="roulette-idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="roulette-idle-text">Spin for a random pick from the vault</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Spin button */}
          <button
            type="button"
            className="roulette-spin-btn"
            onClick={spin}
            disabled={spinning || !hasPool}
          >
            {result && !spinning ? (
              <><RotateCcw size={16} aria-hidden="true" /> Spin again</>
            ) : (
              <><Shuffle size={16} aria-hidden="true" /> {spinning ? 'Spinning…' : 'Spin'}</>
            )}
          </button>
    </Modal>
  );
}
