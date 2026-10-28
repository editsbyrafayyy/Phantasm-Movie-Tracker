'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import OptionWheel from '@/components/browse/OptionWheel';

interface GenreRailProps {
  items:          string[];
  descriptions:   Record<string, string>;
  /** Active genre, `null` = All. */
  genre:          string | null;
  onSelect:       (genre: string | null) => void;
  isUnrestricted: boolean;
}

const DESKTOP_QUERY = '(min-width: 769px)';
const HOVER_INTENT_MS = 140;
const CLOSE_ANIM_MS = 380;
const CLOSE_GRACE_MS = 220;

const toGenre = (item: string) => (item === 'All' ? null : item);

/**
 * Genre selection in three forms:
 *  - desktop resting rail: compact OptionWheel (keyboard operable in place)
 *  - desktop full-screen overlay: the big wheel + HUD, opened on hover/click
 *  - mobile: a horizontal row of .chip buttons (<GenreChips>, rendered in the content column)
 */
export default function GenreRail({ items, descriptions, genre, onSelect, isUnrestricted }: GenreRailProps) {
  const [isOpen, setIsOpen]     = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [pending, setPending]   = useState<string>(genre ?? 'All');

  const hoverTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graceTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRafRef     = useRef<number | null>(null);
  const moveRafRef     = useRef<number | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const clearTimer = (ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
    if (ref.current) { clearTimeout(ref.current); ref.current = null; }
  };

  const openOverlay = useCallback(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) return;
    clearTimer(hoverTimerRef);
    clearTimer(graceTimerRef);
    clearTimer(closeTimerRef);
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setPending(genre ?? 'All');
    setIsOpen(true);
    if (openRafRef.current != null) cancelAnimationFrame(openRafRef.current);
    openRafRef.current = requestAnimationFrame(() => {
      openRafRef.current = null;
      setIsActive(true);
    });
  }, [genre]);

  const closeOverlay = useCallback(() => {
    clearTimer(graceTimerRef);
    // Commit whatever genre the wheel was showing when the overlay closes.
    const next = toGenre(pending);
    if (next !== genre) onSelect(next);
    setIsActive(false);
    clearTimer(closeTimerRef);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setIsOpen(false);
    }, CLOSE_ANIM_MS);
    const back = returnFocusRef.current;
    if (back && document.contains(back)) back.focus({ preventScroll: true });
  }, [pending, genre, onSelect]);

  // Latest close handler for timers/listeners without re-subscribing every render.
  const closeRef = useRef(closeOverlay);
  useEffect(() => { closeRef.current = closeOverlay; }, [closeOverlay]);

  // Escape closes the overlay (listener only while open).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Clear every pending timer / frame on unmount.
  useEffect(() => () => {
    [hoverTimerRef, closeTimerRef, graceTimerRef].forEach(r => { if (r.current) clearTimeout(r.current); });
    if (openRafRef.current != null) cancelAnimationFrame(openRafRef.current);
    if (moveRafRef.current != null) cancelAnimationFrame(moveRafRef.current);
  }, []);

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const clientX = e.clientX;
    if (moveRafRef.current != null) return; // rAF-throttled
    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = null;
      // Moving well past the wheel into empty space starts a short grace timer to close.
      if (clientX > window.innerWidth * 0.52) {
        if (!graceTimerRef.current) {
          graceTimerRef.current = setTimeout(() => {
            graceTimerRef.current = null;
            closeRef.current();
          }, CLOSE_GRACE_MS);
        }
      } else {
        clearTimer(graceTimerRef);
      }
    });
  };

  const activeIndex = genre ? Math.max(items.indexOf(genre), 0) : 0;
  const label = isUnrestricted ? 'Genre' : 'Horror subgenre';

  return (
    <>
      {/* ── Desktop resting rail ── */}
      <aside
        className="browse-genre-rail"
        aria-label={`Filter by ${label.toLowerCase()}`}
        onMouseEnter={() => {
          clearTimer(hoverTimerRef);
          hoverTimerRef.current = setTimeout(openOverlay, HOVER_INTENT_MS);
        }}
        onMouseLeave={() => clearTimer(hoverTimerRef)}
        onClick={openOverlay}
      >
        <p className="browse-genre-rail-label">{label}</p>
        <div className="browse-genre-rail-wheel">
          <OptionWheel
            key={`resting-${genre ?? 'all'}`}
            items={items}
            defaultSelected={activeIndex}
            ariaLabel={label}
            side="left"
            fontSize={1.05}
            spacing={2.1}
            inset={28}
            curve={0.3}
            tilt={4}
            blur={0.25}
            maxBlur={0.8}
            fade={0.13}
            minOpacity={0.22}
            scaleFalloff={0.035}
            smoothing={180}
            activeColor="#e63232"
            textColor="rgba(242,242,242,0.62)"
            loop={false}
            draggable
            soundUrl=""
            onSettle={(_i: number, item: string) => onSelect(toGenre(item))}
          />
        </div>
        <p className="browse-genre-active-label" aria-hidden="true">{genre ?? 'All'}</p>
      </aside>

      {/* ── Desktop full-screen discovery overlay ── */}
      {isOpen && (
        <div
          className={`browse-fullscreen-overlay${isActive ? ' browse-fullscreen-overlay--active' : ''}`}
          onClick={() => closeRef.current()}
          onMouseMove={handleOverlayMouseMove}
          role="dialog"
          aria-modal="true"
          aria-label={`${label} selector`}
        >
          <div className="browse-fullscreen-wheel-zone" onClick={e => e.stopPropagation()}>
            <OptionWheel
              key={`fullscreen-${genre ?? 'all'}`}
              items={items}
              defaultSelected={activeIndex}
              ariaLabel={label}
              autoFocus
              edgeScroll={false}
              side="left"
              fontSize={2.5}
              spacing={1.42}
              inset={80}
              curve={1.15}
              tilt={8}
              blur={0.5}
              maxBlur={2}
              fade={0.16}
              minOpacity={0.22}
              scaleFalloff={0.02}
              smoothing={180}
              activeColor="#e63232"
              textColor="rgba(242,242,242,0.5)"
              loop={false}
              draggable
              soundUrl=""
              onChange={(_i: number, item: string) => setPending(item)}
              onSettle={(_i: number, item: string) => { setPending(item); onSelect(toGenre(item)); }}
            />
          </div>

          <div className="browse-fullscreen-hud-zone" aria-live="polite">
            <p className="browse-fullscreen-hud-badge">{label}</p>
            <h2 className="browse-fullscreen-hud-title">{pending}</h2>
            <p className="browse-fullscreen-hud-desc">{descriptions[pending] || descriptions['All']}</p>
            <p className="browse-fullscreen-hud-footer">
              Scroll or use arrow keys to spin · Click a genre to select · Esc to close
            </p>
          </div>
        </div>
      )}

    </>
  );
}

/**
 * Mobile genre filter: a tuning dial — genres set in display type on a scrolling
 * tick track, with a fixed needle at the centre. Tap a genre and the dial turns to
 * bring it under the needle (hidden on desktop, where the wheel does this job).
 */
export function GenreChips({ items, genre, onSelect, isUnrestricted }: Omit<GenreRailProps, 'descriptions'>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const placedRef = useRef(false);
  const active = genre ?? 'All';
  const label = isUnrestricted ? 'Genre' : 'Subgenre';

  // Centre the active genre: instantly on first paint, then with a smooth turn.
  useEffect(() => {
    const track = trackRef.current;
    const el = track?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!track || !el) return;
    const left = el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2;
    const smooth = placedRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left, behavior: smooth ? 'smooth' : 'instant' });
    placedRef.current = true;
  }, [active]);

  return (
    <div className="genre-dial">
      <p className="genre-dial-label">
        {label} <span className="genre-dial-current">{active}</span>
      </p>
      <div className="genre-dial-window">
        <div ref={trackRef} className="genre-dial-track" role="group" aria-label={label}>
          {items.map(item => (
            <button
              key={item}
              type="button"
              className="genre-dial-item"
              aria-pressed={active === item}
              onClick={() => onSelect(toGenre(item))}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="genre-dial-needle" aria-hidden="true" />
      </div>
    </div>
  );
}
