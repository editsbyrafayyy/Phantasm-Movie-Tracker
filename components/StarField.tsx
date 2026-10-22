'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface Star {
  x:       number;
  y:       number;
  radius:  number;
  opacity: number;
  speed:   number;
  phase:   number;
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x:       Math.random(),
    y:       Math.random(),
    radius:  0.4 + Math.random() * 1.4,
    opacity: 0.3 + Math.random() * 0.7,
    speed:   0.3 + Math.random() * 0.9,
    phase:   Math.random() * Math.PI * 2,
  }));
}

/** Player pages get no starfield or grain — the video should have the GPU to itself. */
function isPlayerRoute(pathname: string) {
  if (pathname.startsWith('/stream/tmdb/')) return true;
  // /stream/[id] (but not the /stream hub itself)
  return /^\/stream\/[^/]+\/?$/.test(pathname);
}

function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Fewer particles on phones — same look, less work per frame.
    const stars = generateStars(window.innerWidth < 640 ? 40 : 80);

    let width = window.innerWidth;
    let height = window.innerHeight;
    let frameId = 0;
    let start: number | null = null;

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width  = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }

    function paint(t: number, full = false) {
      if (!ctx) return;
      if (full) {
        ctx.clearRect(0, 0, width, height);
      } else {
        // Only the stars change, so clear just their boxes — rasterising a full
        // viewport every frame was the dominant main-thread cost on phones.
        for (const star of stars) {
          const r = star.radius + 1;
          ctx.clearRect(star.x * width - r, star.y * height - r, r * 2, r * 2);
        }
      }
      // Bucket stars by rounded opacity (0.1 steps) → at most 10 fill calls per frame.
      const buckets = new Map<string, Star[]>();
      for (const star of stars) {
        const alpha = star.opacity * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
        const key = (Math.round(alpha * 10) / 10).toFixed(1);
        if (key === '0.0') continue;
        const group = buckets.get(key);
        if (group) group.push(star); else buckets.set(key, [star]);
      }
      for (const [alpha, group] of buckets) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        for (const star of group) {
          ctx.moveTo(star.x * width + star.radius, star.y * height);
          ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }

    // The twinkle cycles over seconds, so ~30fps looks identical to 60 and
    // halves the full-viewport repaints competing with scrolling.
    let lastPaint = 0;
    function frame(ts: number) {
      if (start === null) start = ts;
      if (ts - lastPaint >= 32) {
        lastPaint = ts;
        paint((ts - start) / 1000);
      }
      frameId = requestAnimationFrame(frame);
    }

    function stop() {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    function sync() {
      stop();
      if (reducedMotionQuery.matches) {
        paint(1.5); // one static frame
      } else if (!document.hidden) {
        start = null;
        frameId = requestAnimationFrame(frame);
      }
    }

    function onResize() {
      resize();
      if (reducedMotionQuery.matches) paint(1.5);
    }

    resize();
    sync();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', sync);
    reducedMotionQuery.addEventListener('change', sync);

    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', sync);
      reducedMotionQuery.removeEventListener('change', sync);
    };
  }, []);

  return <canvas ref={canvasRef} className="star-field" aria-hidden="true" />;
}

export default function StarField() {
  const pathname = usePathname();
  if (isPlayerRoute(pathname)) return null;
  return (
    <>
      <StarCanvas />
      {/* Film grain overlay (desktop only, styled in globals.css) */}
      <div className="film-grain" aria-hidden="true" />
    </>
  );
}
