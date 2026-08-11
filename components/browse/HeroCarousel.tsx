'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link  from 'next/link';
import { Play } from 'lucide-react';
import type { Entry } from '@/lib/types';
import { extractDominantColor } from '@/lib/posterColor';
import CircularGallery from '@/components/ui/CircularGallery';
import MorphSlider from '@/components/browse/MorphSlider';
import type { MorphSliderRef } from '@/components/browse/MorphSlider';

interface HeroCarouselProps {
  slides:      Entry[];
  canStream:   boolean;
  ownerName:   string;
  totalFilms:  number;
}

export default function HeroCarousel({
  slides,
  canStream,
  ownerName,
  totalFilms,
}: HeroCarouselProps) {
  // current drives both desktop (MorphSlider) and mobile (CircularGallery)
  const [current, setCurrent] = useState(0);

  // Ref for imperative MorphSlider control
  const morphRef = useRef<MorphSliderRef | null>(null);

  // Mobile state & cache
  const [isMobile, setIsMobile] = useState(false);
  const [glowColors, setGlowColors] = useState<Record<number, string>>({});
  const [glowColor, setGlowColor]  = useState<string>('var(--red)');

  // Detect mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Color extraction for mobile glow
  useEffect(() => {
    if (!isMobile) return;
    const entry = slides[current];
    const src = entry?.movie.poster_url ?? entry?.movie.backdrop_url ?? null;
    if (!src) { setGlowColor('var(--red)'); return; }
    if (glowColors[current]) { setGlowColor(glowColors[current]); return; }
    extractDominantColor(src).then(color => {
      const resolved = color ?? 'var(--red)';
      setGlowColors(prev => ({ ...prev, [current]: resolved }));
      setGlowColor(resolved);
    });
  }, [current, isMobile, slides]);

  // Dot handler — drive MorphSlider imperatively when a dot is clicked
  const goTo = useCallback((idx: number) => {
    morphRef.current?.goTo(idx);
  }, []);

  // MorphSlider items — backdrop preferred, poster as fallback
  const morphItems = useMemo(() => slides.map(s => ({
    image: s.movie.backdrop_url ?? s.movie.poster_url ?? '',
    caption: s.movie.title,
  })), [slides]);

  // Mobile circular gallery items
  const galleryItems = useMemo(() => slides.map(s => ({
    image: s.movie.poster_url ?? s.movie.backdrop_url ?? '',
    text: s.movie.title,
  })), [slides]);

  if (!slides.length) return null;

  const entry = slides[current];
  const movie = entry.movie;

  return (
    <div className="hero-carousel">

      {/* ── DESKTOP: MorphSlider — bounded, inset, rounded ── */}
      {!isMobile && (
        <div className="hero-morph-wrapper">
          <MorphSlider
            ref={morphRef}
            items={morphItems}
            transition="melt"
            intensity={0.5}
            aberration={0.3}
            drift={0.35}
            autoplay
            autoplayDelay={6}
            radius={20}
            overlayColor="#0c0c0e"
            showCaptions={false}
            showControls={false}
            showIndicators={false}
            onSlideChange={(i: number) => setCurrent(i)}
          />

          {/* Gradient overlays on top of the morph canvas */}
          <div className="hero-gradient-left"  />
          <div className="hero-gradient-bottom" />

          {/* Content overlay — driven by current (synced from MorphSlider via onSlideChange) */}
          <div
            className="hero-content"
            key={current}
            style={{ animation: 'heroFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both' }}
          >
            <p className="hero-eyebrow">
              {ownerName}&apos;s Phantasm &middot; {totalFilms} Films Rated
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

      {/* ── MOBILE: poster-led layout (unchanged) ── */}
      {isMobile && (
        <div className="hero-mobile-wrap">
          {/* Ambient glow */}
          <div className="hero-mobile-glow" style={{ background: glowColor }} />

          {/* Centered WebGL poster gallery */}
          <div className="hero-mobile-gallery-container">
            <CircularGallery
              items={galleryItems}
              bend={2}
              textColor="rgba(255,255,255,0.7)"
              borderRadius={0.05}
              scrollEase={0.03}
              currentIndex={current}
              onChange={(index) => setCurrent(index)}
            />
          </div>

          {/* Text block */}
          <div className="hero-mobile-content">
            <p className="hero-eyebrow">
              {ownerName}&apos;s Phantasm &middot; {totalFilms} Films Rated
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
                  onClick={() => setCurrent(i)}
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
