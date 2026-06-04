/**
 * lib/motion.ts — Centralized Framer Motion animation variants.
 * Import from here to keep animations consistent across the app.
 * This file is safe to import in both client and server components.
 */

import type { Variants, Transition } from 'framer-motion';

// ── Page-level ────────────────────────────────────────────────────────────────

/** Standard fade + slide-up for page sections */
export const fadeUp: Variants = {
  initial:  { opacity: 0, y: 22 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.44, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, y: 10, transition: { duration: 0.2, ease: 'easeIn' } },
};

/** Fade only — no Y movement */
export const fadeIn: Variants = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1, transition: { duration: 0.35 } },
  exit:     { opacity: 0, transition: { duration: 0.2 } },
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

// ── Cards ─────────────────────────────────────────────────────────────────────

/** Spring hover + tap for movie cards */
export const cardSpring = {
  whileHover: { scale: 1.04, y: -6, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
  whileTap:   { scale: 0.97, transition: { duration: 0.12 } },
};

// ── Backdrop hero ─────────────────────────────────────────────────────────────

/** Subtle zoom-in on backdrop image mount */
export const backdropZoom: Variants = {
  initial:  { scale: 1.06, opacity: 0 },
  animate:  { scale: 1.0, opacity: 1, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
};

// ── Dropdowns / overlays ──────────────────────────────────────────────────────

/** Dropdown slides down from slightly above */
export const slideDown: Variants = {
  initial:  { opacity: 0, y: -10, scale: 0.97 },
  animate:  { opacity: 1, y: 0, scale: 1, transition: { duration: 0.16, ease: 'easeOut' } },
  exit:     { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } },
};

/** Overlay backdrop fade */
export const overlayFade: Variants = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1, transition: { duration: 0.2 } },
  exit:     { opacity: 0, transition: { duration: 0.16 } },
};

// ── Tab content ───────────────────────────────────────────────────────────────

/** Tab panel slides in from the right */
export const tabContent: Variants = {
  initial:  { opacity: 0, x: 14 },
  animate:  { opacity: 1, x: 0, transition: { duration: 0.24, ease: 'easeOut' } },
  exit:     { opacity: 0, x: -10, transition: { duration: 0.16 } },
};

// ── Toast ─────────────────────────────────────────────────────────────────────

/** Spring toast entrance + slide-out exit */
export const toastVariants: Variants = {
  initial:  { opacity: 0, y: 20, scale: 0.94 },
  animate:  {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 30 },
  },
  exit:     { opacity: 0, y: 16, scale: 0.94, transition: { duration: 0.18 } },
};

// ── Score bars ────────────────────────────────────────────────────────────────

/** Animate bar width from 0 to actual value */
export function scoreBarVariant(pct: number): Variants {
  return {
    initial: { width: '0%' },
    animate: { width: `${pct}%`, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 } },
  };
}

// ── Shared spring transition ──────────────────────────────────────────────────

export const springTransition: Transition = {
  type:      'spring',
  stiffness: 300,
  damping:   28,
};
