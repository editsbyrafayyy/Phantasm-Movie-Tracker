'use client';

import { useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Link  from 'next/link';
import { Play } from 'lucide-react';
import type { Entry } from '@/lib/types';
import { extractDominantColor } from '@/lib/posterColor';
import type { MorphSliderRef } from '@/components/browse/MorphSlider';

// WebGL heroes load only for the layout that is actually shown.
const MorphSlider     = dynamic(() => import('@/components/browse/MorphSlider'), { ssr: false });
const CircularGallery = dynamic(() => import('@/components/ui/CircularGallery'), { ssr: false });

interface HeroCarouselProps {
  slides:      Entry[];
  canStream:   boolean;
  ownerName:   string;
  totalFilms:  number;
}

const MOBILE_QUERY = '(max-width: 640px)';

function subscribeMobile(cb: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const getMobile = () => window.matchMedia(MOBILE_QUERY).matches;
/** Unknown on the server → render a lightweight placeholder until the client knows. */
const getMobileServer = () => null;

function HeroText({ entry, eyebrow, canStream }: { entry: Entry; eyebrow: string; canStream: boolean }) {
  const movie = entry.movie;
  const streamPath = `/stream/${movie.omdb_id || movie.tmdb_id || entry.id}`;
  return (
    <>
      <p className="hero-eyebrow">{eyebrow}</p>
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
        {/* Streaming is members-only, so guests don't see the button at all. */}
        {canStream && (
          <Link href={streamPath} className="btn-watch">
            <Play size={16} fill="currentColor" aria-hidden="true" />
            Watch now
          </Link>
        )}
        <Link href={`/vault/${entry.id}`} className="btn-edit">
          View details
        </Link>
      </div>
    </>
  );
}

export default function HeroCarousel({
  slides,
  canStream,
  ownerName,
  totalFilms,
}: HeroCarouselProps) {
  // current drives both desktop (MorphSlider) and mobile (CircularGallery)
  const [current, setCurrent] = useState(0);
  const morphRef = useRef<MorphSliderRef | null>(null);
  const isMobile = useSyncExternalStore(subscribeMobile, getMobile, getMobileServer);

  // Dominant poster colour per image URL, for the mobile ambient glow.
  const [glowCache, setGlowCache] = useState<Record<string, string>>({});
  const glowSrc = slides[current]?.movie.poster_url ?? slides[current]?.movie.backdrop_url ?? null;
  const glowColor = (glowSrc && glowCache[glowSrc]) || 'var(--red)';

  useEffect(() => {
    if (!isMobile || !glowSrc || glowCache[glowSrc]) return;
    let stale = false;
    extractDominantColor(glowSrc).then(color => {
      if (stale) return; // user already swiped to another slide
      setGlowCache(prev => ({ ...prev, [glowSrc]: color ?? 'var(--red)' }));
    });
    return () => { stale = true; };
  }, [isMobile, glowSrc, glowCache]);

  const goTo = useCallback((idx: number) => {
    morphRef.current?.goTo(idx);
  }, []);

  const morphItems = useMemo(() => slides.map(s => ({
    image: s.movie.backdrop_url ?? s.movie.poster_url ?? '',
    caption: s.movie.title,
  })), [slides]);

  const galleryItems = useMemo(() => slides.map(s => ({
    image: s.movie.poster_url ?? s.movie.backdrop_url ?? '',
    text: s.movie.title,
  })), [slides]);

  if (!slides.length) return null;

  const entry = slides[Math.min(current, slides.length - 1)];
  const eyebrow = `Top rated by ${ownerName} · ${totalFilms} films`;

  const dots = slides.length > 1 && (
    <div className="hero-dots" role="group" aria-label="Choose featured film">
      {slides.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className={`hero-dot${i === current ? ' active' : ''}`}
          onClick={() => (isMobile ? setCurrent(i) : goTo(i))}
          aria-label={`Show ${s.movie.title}`}
          aria-current={i === current ? 'true' : undefined}
        />
      ))}
    </div>
  );

  if (isMobile === null) {
    return (
      <div className="hero-carousel">
        <div className="hero-placeholder">
          {/* phones: stands in for the centred gallery poster until WebGL mounts */}
          <div className="skeleton hero-placeholder-poster" aria-hidden="true" />
          <div className="hero-content">
            <HeroText entry={entry} eyebrow={eyebrow} canStream={canStream} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-carousel">
      {!isMobile ? (
        <div className="hero-morph-wrapper">
          <MorphSlider
            controlRef={morphRef}
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

          <div className="hero-gradient-left" />
          <div className="hero-gradient-bottom" />

          <div className="hero-content hero-content-anim" key={current}>
            <HeroText entry={entry} eyebrow={eyebrow} canStream={canStream} />
          </div>

          {dots}
        </div>
      ) : (
        <div className="hero-mobile-wrap">
          <div className="hero-mobile-glow" style={{ background: glowColor }} />

          <div className="hero-mobile-gallery-container">
            <CircularGallery
              items={galleryItems}
              bend={2}
              borderRadius={0.05}
              scrollEase={0.03}
              currentIndex={current}
              onChange={(index) => setCurrent(index)}
            />
          </div>

          <div className="hero-mobile-content">
            <HeroText entry={entry} eyebrow={eyebrow} canStream={canStream} />
          </div>

          {dots}
        </div>
      )}
    </div>
  );
}
