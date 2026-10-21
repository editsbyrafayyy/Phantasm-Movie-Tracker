/**
 * lib/motion.ts — Centralized Framer Motion animation variants.
 * Import from here to keep animations consistent across the app.
 * Reduced motion is honoured globally via <MotionConfig reducedMotion="user">.
 */

import type { Variants } from 'framer-motion';

// ── Page-level ────────────────────────────────────────────────────────────────

/** Standard fade + slide-up for page sections */
export const fadeUp: Variants = {
  initial:  { opacity: 0, y: 22 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.44, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, y: 10, transition: { duration: 0.2, ease: 'easeIn' } },
};

// ── Grid stagger ──────────────────────────────────────────────────────────────

/** Wrapper that staggers its children */
export const staggerContainer: Variants = {
  initial:  {},
  animate:  { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};

/** Each child inside staggerContainer */
export const staggerItem: Variants = {
  initial:  { opacity: 0, y: 26 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * Mount animation for item `index` of a long list: the same rise as `staggerItem`, but only the
 * first `limit` items animate (the first screen). Later items mount already in place, so a
 * 276-film grid doesn't queue 12 seconds of staggered entrances or keep cards invisible.
 */
export function staggerEnter(index: number, limit = 20) {
  if (index >= limit) return { initial: false as const };
  return {
    initial: { opacity: 0, y: 26 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] as const, delay: 0.05 + index * 0.035 },
    },
  };
}

// ── Cards ─────────────────────────────────────────────────────────────────────

/** Spring hover + tap for movie cards (stiffness 280 / damping 22 per design system) */
export const cardSpring = {
  whileHover: { scale: 1.04, y: -6, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
  whileTap:   { scale: 0.97, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
};

// ── Backdrop hero ─────────────────────────────────────────────────────────────

/** Subtle zoom-in on backdrop image mount */
export const backdropZoom: Variants = {
  initial:  { scale: 1.06, opacity: 0 },
  animate:  { scale: 1.0, opacity: 1, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
};

// ── Score bars ────────────────────────────────────────────────────────────────

/** Animate bar width from 0 to actual value */
export function scoreBarVariant(pct: number): Variants {
  return {
    initial: { width: '0%' },
    animate: { width: `${pct}%`, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 } },
  };
}
