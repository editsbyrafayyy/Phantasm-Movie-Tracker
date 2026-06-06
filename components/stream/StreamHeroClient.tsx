'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Entry } from '@/lib/types';

const AUTO_ADVANCE_MS = 6000;

export default function StreamHeroClient({ featured }: { featured: Entry[] }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((idx: number) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 500);
  }, [animating, current]);

  const prev = useCallback(() => {
    goTo((current - 1 + featured.length) % featured.length);
  }, [current, featured.length, goTo]);

  const next = useCallback(() => {
    goTo((current + 1) % featured.length);
  }, [current, featured.length, goTo]);

  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  });

  // Auto-advance
  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setTimeout(() => {
      nextRef.current();
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [current, featured.length]);

  // Touch swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) {
        next();
      } else {
        prev();
      }
    }
    touchStartX.current = null;
  }

  if (featured.length === 0) return null;

  const entry = featured[current];
  const bg    = entry?.movie.backdrop_url ?? entry?.movie.poster_url ?? null;

  return (
    <div 
      className="stream-hero"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background image */}
      <AnimatePresence mode="sync">
        {bg && (
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Image
              src={bg}
              alt={entry.movie.title}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
              unoptimized
              priority
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="stream-hero-gradient" />

      {/* Slide Navigation Arrows */}
      {featured.length > 1 && (
        <>
          <button
            className="hero-arrow hero-arrow-left"
            onClick={prev}
            aria-label="Previous film"
            style={{ zIndex: 10 }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className="hero-arrow hero-arrow-right"
            onClick={next}
            aria-label="Next film"
            style={{ zIndex: 10 }}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div className="stream-hero-content">
        {/* Dots */}
        {featured.length > 1 && (
          <div className="stream-hero-dots">
            {featured.map((_, i) => (
              <button
                key={i}
                className={`stream-hero-dot${i === current ? ' active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Title + actions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="stream-hero-title">{entry.movie.title}</h2>

            {entry.total !== null && entry.total > 0 && (
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                color: 'var(--red)',
                marginBottom: 12,
                lineHeight: 1,
              }}>
                {entry.total}
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>
                  {' '}/ 10
                </span>
              </p>
            )}

            <div className="stream-hero-btns">
              {entry.movie.omdb_id && (
                <Link href={`/stream/${entry.movie.omdb_id}`} className="btn-watch">
                  <Play size={14} fill="white" color="white" />
                  Watch Now
                </Link>
              )}
              <Link href={`/vault/${entry.id}`} className="btn-edit">
                View Details
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
