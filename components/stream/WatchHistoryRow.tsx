'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// NOTE: this history is written by the player (VideoPlayerClient). This row only
// reads it (and drops expired entries / clears on request) — never change the format.
export interface HistoryEntry {
  id: string;
  title: string;
  poster_url: string | null;
  type: string;
  watchedAt: number;
  progress?: number; // 0-100 percentage or 0-1 ratio
  currentTime?: number;
  duration?: number;
  completed?: boolean;
}

const HISTORY_KEY = 'vault_watch_history';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

// ── localStorage as an external store ──────────────────────────────────────
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === HISTORY_KEY) cb(); };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage); };
}
function readRaw(): string | null {
  try { return localStorage.getItem(HISTORY_KEY); } catch { return null; }
}
const readServer = () => null;

function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const all = JSON.parse(raw);
    return Array.isArray(all) ? all : [];
  } catch { return []; }
}

/** A film/show counts as finished once >= 85% watched. */
function isCompleted(e: HistoryEntry): boolean {
  if (e.completed) return true;
  if (typeof e.progress === 'number') {
    if (e.progress >= 85) return true;
    if (e.progress <= 1 && e.progress >= 0.85) return true;
  }
  if (e.currentTime && e.duration && e.duration > 0 && e.currentTime / e.duration >= 0.85) return true;
  if (e.type === 'tv') {
    try {
      const stored = localStorage.getItem(`watched:${e.id}`);
      if (stored) {
        const eps: Record<string, boolean> = JSON.parse(stored);
        const keys = Object.keys(eps);
        if (keys.length > 0 && keys.filter(k => eps[k]).length / keys.length >= 0.85) return true;
      }
    } catch { /* ignore */ }
  }
  return false;
}

function inProgress(raw: string | null, now: number): HistoryEntry[] {
  return parseHistory(raw).filter(e => now - e.watchedAt < TTL_MS && !isCompleted(e));
}

function progressPct(item: HistoryEntry): number | null {
  if (typeof item.progress === 'number' && item.progress > 0 && item.progress < 85) {
    return item.progress <= 1 ? Math.round(item.progress * 100) : Math.round(item.progress);
  }
  if (item.currentTime && item.duration && item.duration > 0) {
    const ratio = item.currentTime / item.duration;
    if (ratio > 0 && ratio < 0.85) return Math.round(ratio * 100);
  }
  return null;
}

export default function WatchHistoryRow() {
  const raw = useSyncExternalStore(subscribe, readRaw, readServer);
  // Snapshot "now" once per mount (TTL granularity is days, so this is plenty).
  const [now] = useState(() => Date.now());
  const items = useMemo(() => inProgress(raw, now), [raw, now]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Drop expired (>30d) entries from storage so they don't linger.
  useEffect(() => {
    const all = parseHistory(raw);
    const fresh = all.filter(e => now - e.watchedAt < TTL_MS);
    if (fresh.length !== all.length) {
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
    }
  }, [raw, now]);

  // Track scroll affordances (subscribe to scroll/resize; state set only in callbacks).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener('scroll', update); };
  }, [items.length]);

  function clearHistory() {
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
    listeners.forEach(l => l());
  }

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -distance : distance, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <section className="watch-history-section" aria-labelledby="watch-history-heading">
      <div className="watch-history-header">
        <div className="watch-history-heading-group">
          <h2 id="watch-history-heading" className="watch-history-label">Continue watching</h2>
          <span className="watch-history-count">{items.length}</span>
        </div>
        <div className="watch-history-controls">
          {items.length > 3 && (
            <>
              <button
                type="button"
                className="icon-btn"
                onClick={() => scrollByAmount('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => scrollByAmount('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          <button type="button" className="btn-ghost watch-history-clear" onClick={clearHistory} aria-label="Clear watch history">
            <Trash2 size={14} aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>

      <div className="watch-history-row" ref={scrollRef}>
        {items.map(item => {
          const pct = progressPct(item);
          return (
            <Link
              key={item.id}
              href={`/stream/${item.id}`}
              className="watch-history-card"
              prefetch={false}
              aria-label={`Resume ${item.title}${pct !== null ? `, ${pct}% watched` : ''}`}
            >
              <div className="watch-history-poster">
                {item.poster_url ? (
                  <Image src={item.poster_url} alt="" fill className="browse-card-img" sizes="120px" />
                ) : (
                  <div className="watch-history-poster-fallback" aria-hidden="true">
                    {item.title.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="watch-history-play-overlay" aria-hidden="true">
                  <span className="watch-history-play-icon"><Play size={20} fill="currentColor" /></span>
                </div>

                {pct !== null && (
                  <div className="watch-history-progress-track" aria-hidden="true">
                    <div className="watch-history-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
              <p className="watch-history-title" title={item.title}>{item.title}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
