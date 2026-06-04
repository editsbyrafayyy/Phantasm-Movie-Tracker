'use client';

import { useEffect, useRef } from 'react';

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

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef  = useRef<Star[]>([]);
  const frameRef  = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width  = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }

    resize();
    starsRef.current = generateStars(80);
    window.addEventListener('resize', resize);

    let start: number | null = null;
    let animationFrameId: number;

    function draw(ts: number) {
      if (document.hidden) return;
      if (!canvas || !ctx) return;
      if (!start) start = ts;
      const t = (ts - start) / 1000;

      ctx.clearRect(0, 0, width, height);

      // Bucket stars by rounded opacity (0.1 steps) to minimize draw calls from 80 to max 10
      const buckets: Record<string, Star[]> = {};
      for (const star of starsRef.current) {
        const alpha = star.opacity * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
        const alphaKey = (Math.round(alpha * 10) / 10).toFixed(1);
        if (alphaKey === '0.0') continue; // Skip invisible stars
        if (!buckets[alphaKey]) buckets[alphaKey] = [];
        buckets[alphaKey].push(star);
      }

      for (const [alpha, group] of Object.entries(buckets)) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        for (const star of group) {
          ctx.moveTo(star.x * width + star.radius, star.y * height);
          ctx.arc(
            star.x * width,
            star.y * height,
            star.radius,
            0,
            Math.PI * 2
          );
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
      frameRef.current = animationFrameId;
    }

    animationFrameId = requestAnimationFrame(draw);
    frameRef.current = animationFrameId;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        start = null;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(draw);
        frameRef.current = animationFrameId;
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        0,
        pointerEvents: 'none',
        display:       'block',
      }}
      aria-hidden="true"
    />
  );
}
