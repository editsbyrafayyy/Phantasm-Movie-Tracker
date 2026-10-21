'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';

interface RecentlyViewedItem {
  id: string;
  title: string;
  poster_url: string | null;
  year: number | null;
  total: number | null;
  viewedAt: number;
}

const STORAGE_KEY = 'vault_recently_viewed';
/** Cookie hint read by app/page.tsx so the server can reserve this row's height. */
export const RECENT_HINT_COOKIE = 'ph_recent';
const EMPTY: RecentlyViewedItem[] = [];
const PLACEHOLDER_CARDS = 8;

// ── localStorage-backed store (cached by raw string so snapshots are stable) ──
let cachedRaw: string | null = null;
let cachedItems: RecentlyViewedItem[] = EMPTY;
const localListeners = new Set<() => void>();

function readItems(): RecentlyViewedItem[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch { /* storage blocked */ }
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedItems = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

function subscribe(cb: () => void) {
  localListeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) cb(); };
  window.addEventListener('storage', onStorage);
  return () => {
    localListeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

function clearItems() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  localListeners.forEach(l => l());
}

/**
 * localStorage-backed, so it can only render on the client. When the server knows
 * (via the cookie hint) that this browser has history, it renders a same-height
 * placeholder instead of nothing, so the rows below don't jump after hydration.
 */
export default function RecentlyViewedRow({ reserve = false }: { reserve?: boolean }) {
  const items = useSyncExternalStore(subscribe, readItems, () => EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  // Keep the server hint in sync with what's actually stored.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-hydration flag */
    setHydrated(true);
    try {
      document.cookie = items.length
        ? `${RECENT_HINT_COOKIE}=1; path=/; max-age=31536000; samesite=lax`
        : `${RECENT_HINT_COOKIE}=; path=/; max-age=0; samesite=lax`;
    } catch { /* cookies blocked */ }
  }, [items.length]);

  // ResizeObserver fires once on observe and again on any size change.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -distance : distance, behavior: 'smooth' });
  };

  if (!items.length) {
    if (!reserve || hydrated) return null;
    return (
      <section className="category-section recently-viewed-section is-placeholder" aria-hidden="true">
        <div className="category-header">
          <div className="category-header-title-group">
            <h2 className="category-heading">Recently viewed</h2>
            <span className="category-count">0 films</span>
          </div>
          <div className="category-header-actions">
            <span className="text-btn">Clear</span>
          </div>
        </div>
        <div className="recently-viewed-row">
          {Array.from({ length: PLACEHOLDER_CARDS }).map((_, i) => (
            <div key={i} className="recently-viewed-card">
              <div className="skeleton recently-viewed-poster" />
              <p className="recently-viewed-title">&nbsp;</p>
              <p className="recently-viewed-year">&nbsp;</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="category-section recently-viewed-section" aria-labelledby="recently-viewed-heading">
      <div className="category-header">
        <div className="category-header-title-group">
          <h2 id="recently-viewed-heading" className="category-heading">Recently viewed</h2>
          <span className="category-count">{items.length} film{items.length === 1 ? '' : 's'}</span>
        </div>

        <div className="category-header-actions">
          <button type="button" className="text-btn" onClick={clearItems}>
            Clear
          </button>
          {items.length > 4 && (
            <div className="category-nav-btns">
              <button
                type="button"
                className="category-nav-btn"
                onClick={() => scrollByAmount('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll recently viewed left"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="category-nav-btn"
                onClick={() => scrollByAmount('right')}
                disabled={!canScrollRight}
                aria-label="Scroll recently viewed right"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="recently-viewed-row" ref={scrollRef} onScroll={updateScrollState}>
        {items.map(item => (
          <Link key={item.id} href={`/vault/${item.id}`} className="recently-viewed-card">
            <div className="recently-viewed-poster">
              {item.poster_url ? (
                <Image
                  src={item.poster_url}
                  alt=""
                  fill
                  className="recently-viewed-poster-img"
                  sizes="(max-width: 768px) 90px, 110px"
                />
              ) : (
                <div className="recently-viewed-poster-fallback">
                  <Film size={16} aria-hidden="true" />
                </div>
              )}

              {item.total !== null && item.total > 0 && (
                <span className="recently-viewed-score" aria-label={`Score ${item.total} out of 10`}>
                  {item.total}
                </span>
              )}
            </div>

            <p className="recently-viewed-title">{item.title}</p>
            {item.year && <p className="recently-viewed-year">{item.year}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}
