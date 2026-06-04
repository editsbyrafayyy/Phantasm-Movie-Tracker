'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Film, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { RECOMMEND_COLOR, SUBGENRE_HEX } from '@/lib/config';
import { staggerItem, cardSpring } from '@/lib/motion';
import type { Entry } from '@/lib/types';

interface MovieCardProps {
  entry: Entry;
}

export default function MovieCard({ entry }: MovieCardProps) {
  const { movie, total, recommend, subgenre } = entry;
  const poster    = movie?.poster_url ?? null;
  const backdrop  = movie?.backdrop_url ?? null;
  const title     = movie?.title ?? 'Unknown';
  const year      = movie?.year ?? null;
  const recColor  = recommend ? RECOMMEND_COLOR[recommend] : undefined;
  const genreHex  = SUBGENRE_HEX[subgenre] ?? '#333333';
  const hasScore  = total !== null && total > 0;

  // Three-tier image fallback: poster → backdrop → genre gradient
  const imgSrc = poster ?? backdrop ?? null;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={cardSpring.whileHover}
      whileTap={cardSpring.whileTap}
      style={{ willChange: 'transform' }}
    >
      <Link
        href={`/vault/${entry.id}`}
        className="movie-card"
        aria-label={`${title}${year ? `, ${year}` : ''}`}
      >
        <div className="movie-card-poster">
          {/* Tier 1 & 2: poster or backdrop image */}
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={`${title} poster`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
              className="movie-card-img"
              unoptimized
            />
          ) : (
            /* Tier 3: genre color gradient */
            <div
              className="movie-card-no-poster"
              style={{
                background: `linear-gradient(160deg, #111 0%, ${genreHex}22 100%)`,
              }}
            >
              <Film size={28} strokeWidth={1.5} />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="movie-card-overlay" aria-hidden="true" />

          {/* Score badge — only shown when total > 0 and not null */}
          {hasScore && (
            <span className="movie-card-score" aria-label={`Score: ${total}`}>
              {total}
            </span>
          )}

          {/* Recommend dot */}
          {recommend && recColor && (
            <span
              className="movie-card-rec-dot"
              style={{ background: recColor }}
              title={recommend}
              aria-label={`Recommend: ${recommend}`}
            />
          )}

          {/* Play overlay — CSS-driven hover reveal */}
          <div className="movie-card-play" aria-hidden="true">
            <div className="movie-card-play-icon">
              <Play size={18} fill="white" color="white" />
            </div>
          </div>

          {/* Bottom strip */}
          <div className="movie-card-bottom">
            <p className="movie-card-title">{title}</p>
            {year && <p className="movie-card-year">{year}</p>}
          </div>

          {/* Subgenre chip — CSS hover reveal */}
          {subgenre && (
            <span className="movie-card-genre-chip" aria-hidden="true">
              {subgenre}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
