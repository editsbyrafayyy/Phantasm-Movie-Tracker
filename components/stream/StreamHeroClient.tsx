'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import type { Entry } from '@/lib/types';

export default function StreamHeroClient({ featured }: { featured: Entry[] }) {
  const [current, setCurrent] = useState(0);

  // Auto-cycle
  // (using useEffect would need "use client" at top which is already set)
  const entry = featured[current];
  const bg    = entry?.movie.backdrop_url ?? entry?.movie.poster_url ?? null;

  if (featured.length === 0) return null;

  return (
    <div className="stream-hero">
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

      <div className="stream-hero-content">
        {/* Dots */}
        {featured.length > 1 && (
          <div className="stream-hero-dots">
            {featured.map((_, i) => (
              <button
                key={i}
                className={`stream-hero-dot${i === current ? ' active' : ''}`}
                onClick={() => setCurrent(i)}
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
