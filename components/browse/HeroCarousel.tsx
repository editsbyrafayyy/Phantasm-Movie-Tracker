'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { Entry } from '@/lib/types';
import { extractDominantColor } from '@/lib/posterColor';
import CircularGallery from '@/components/ui/CircularGallery';

interface HeroCarouselProps {
  slides:      Entry[];
  canStream:   boolean;
  ownerName:   string;
  totalFilms:  number;
}

const AUTO_ADVANCE_MS = 6000;

export default function HeroCarousel({
  slides,
  canStream,
  ownerName,
  totalFilms,
}: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Touch tracking
  const touchStartX = useRef<number | null>(null);

  // Mobile state & cache
  const [isMobile, setIsMobile] = useState(false);
  const [glowColors, setGlowColors] = useState<Record<number, string>>({});
  const [glowColor, setGlowColor] = useState<string>('var(--red)');

  // Detect mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Color extraction for glow
  useEffect(() => {
    if (!isMobile) return;
    const entry = slides[current];
    const src = entry?.movie.poster_url ?? entry?.movie.backdrop_url ?? null;
    if (!src) {
      setGlowColor('var(--red)');
      return;
    }

    if (glowColors[current]) {
      setGlowColor(glowColors[current]);
      return;
    }

    extractDominantColor(src).then(color => {
      const resolved = color ?? 'var(--red)';
      setGlowColors(prev => ({ ...prev, [current]: resolved }));
      setGlowColor(resolved);
    });
  }, [current, isMobile, slides]);

  const goTo = useCallback((idx: number) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 600);
  }, [animating, current]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, slides.length, goTo]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, slides.length, goTo]);

  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  });

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setTimeout(() => {
      nextRef.current();
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [current, slides.length]);

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

  const galleryItems = useMemo(() => slides.map(s => ({
    image: s.movie.poster_url ?? s.movie.backdrop_url ?? '',
    text: s.movie.title
  })), [slides]);

  if (!slides.length) return null;

  const entry = slides[current];
  const movie = entry.movie;
  const posterSrc = movie.poster_url ?? movie.backdrop_url ?? null;

  return (
    <div
      className="hero-carousel"
      onTouchStart={isMobile ? undefined : onTouchStart}
      onTouchEnd={isMobile ? undefined : onTouchEnd}
    >
      {/* Slide images — all rendered, CSS opacity transition between them */}
      {slides.map((s, i) => {
        const backdropImg = s.movie.backdrop_url ?? null;
        const posterImg   = s.movie.poster_url   ?? null;
        const img = backdropImg ?? posterImg;
        return img ? (
          <div
            key={s.id}
            className="hero-slide-bg"
            style={{ opacity: i === current ? 1 : 0 }}
            aria-hidden={i !== current}
          >
            <Image
              src={img}
              alt={s.movie.title}
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center top',
              }}
              sizes="100vw"
              priority={i === 0}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElFTkSuQmCC"
            />
          </div>
        ) : null;
      })}

      {/* Gradient overlays */}
      <div className="hero-gradient-left"  />
      <div className="hero-gradient-bottom" />

      {/* Content — animates on slide change */}
      <div
        className="hero-content"
        key={current}
        style={{ animation: 'heroFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <p className="hero-eyebrow">
          {ownerName}&apos;s Vault &middot; {totalFilms} Films Rated
        </p>

        <h1 className="hero-title">{movie.title}</h1>

        {entry.total !== null && entry.total > 0 && (
          <div className="hero-score-row">
            <span className="hero-score">{entry.total}</span>
            <span className="hero-score-denom">/ 10</span>
          </div>
        )}

        {movie.year && (
          <p className="hero-meta">
            {movie.year}
            {movie.director && <> &middot; {movie.director}</>}
            {movie.runtime_min && <> &middot; {movie.runtime_min} min</>}
          </p>
        )}

        <div className="hero-actions">
          {entry.id && (
            <Link href={canStream ? `/vault/${entry.id}` : '/login'} className="btn-watch">
              <Play size={14} fill="white" color="white" />
              Watch Now
            </Link>
          )}
          <Link href={canStream ? `/vault/${entry.id}` : '/login'} className="btn-edit">
            View Details
          </Link>
        </div>
      </div>

      {/* Arrow buttons */}
      {slides.length > 1 && (
        <>
          <button
            className="hero-arrow hero-arrow-left"
            onClick={prev}
            aria-label="Previous film"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className="hero-arrow hero-arrow-right"
            onClick={next}
            aria-label="Next film"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === current ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── MOBILE: poster-led layout ────── */}
      {isMobile && (
        <div className="hero-mobile-wrap">
          {/* Ambient glow */}
          <div
            className="hero-mobile-glow"
            style={{ background: glowColor }}
          />

          {/* Centered WebGL poster gallery */}
          <div className="hero-mobile-gallery-container">
            <CircularGallery
              items={galleryItems}
              bend={2}
              textColor="rgba(255,255,255,0.7)"
              borderRadius={0.05}
              scrollEase={0.03}
              currentIndex={current}
              onChange={(index) => {
                setCurrent(index);
              }}
            />
          </div>

          {/* Text block */}
          <div className="hero-mobile-content">
            <p className="hero-eyebrow">
              {ownerName}&apos;s Vault &middot; {totalFilms} Films Rated
            </p>
            <h1 className="hero-title">{movie.title}</h1>
            {entry.total !== null && entry.total > 0 && (
              <div className="hero-score-row">
                <span className="hero-score">{entry.total}</span>
                <span className="hero-score-denom">/ 10</span>
              </div>
            )}
            {movie.year && (
              <p className="hero-meta">
                {movie.year}
                {movie.director && <> &middot; {movie.director}</>}
                {movie.runtime_min && <> &middot; {movie.runtime_min} min</>}
              </p>
            )}
            <div className="hero-actions">
              {entry.id && (
                <Link href={canStream ? `/vault/${entry.id}` : '/login'} className="btn-watch">
                  <Play size={14} fill="white" color="white" /> Watch Now
                </Link>
              )}
              <Link href={canStream ? `/vault/${entry.id}` : '/login'} className="btn-edit">
                View Details
              </Link>
            </div>
          </div>

          {/* Dot indicators */}
          {slides.length > 1 && (
            <div className="hero-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`hero-dot${i === current ? ' active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
