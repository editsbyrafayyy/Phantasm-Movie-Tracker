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

    function resize() {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    starsRef.current = generateStars(180);
    window.addEventListener('resize', resize);

    let start: number | null = null;

    function draw(ts: number) {
      if (!canvas || !ctx) return;
      if (!start) start = ts;
      const t = (ts - start) / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const star of starsRef.current) {
        const alpha = star.opacity * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
        ctx.beginPath();
        ctx.arc(
          star.x * canvas.width,
          star.y * canvas.height,
          star.radius,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
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
