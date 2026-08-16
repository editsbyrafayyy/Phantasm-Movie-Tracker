'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Film, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { RECOMMEND_COLOR, SUBGENRE_HEX } from '@/lib/config';
import { staggerItem, cardSpring } from '@/lib/motion';
import type { Entry } from '@/lib/types';
import { useAuth } from '@/components/layout/AuthProvider';
import WatchlistButton from '@/components/watchlist/WatchlistButton';

interface MovieCardProps {
  entry: Entry;
  priority?: boolean;
}

export default function MovieCard({ entry, priority = false }: MovieCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { movie, total, recommend, subgenre } = entry;
  const poster    = movie?.poster_url ?? null;
  const backdrop  = movie?.backdrop_url ?? null;
  const title     = movie?.title ?? 'Unknown';
  const year      = movie?.year ?? null;
  const runtime_min = movie?.runtime_min ?? null;
  const recColor    = recommend ? RECOMMEND_COLOR[recommend] : undefined;
  const genreHex    = SUBGENRE_HEX[subgenre] ?? '#333333';
  const hasScore    = total !== null && total > 0;

  // Format runtime (e.g. 94 -> 1h 34m or 45 -> 45m)
  const formattedRuntime = runtime_min
    ? runtime_min >= 60
      ? `${Math.floor(runtime_min / 60)}h ${runtime_min % 60 ? `${runtime_min % 60}m` : ''}`
      : `${runtime_min}m`
    : null;

  const metaText = [year, formattedRuntime].filter(Boolean).join(' · ');

  // Three-tier image fallback: poster → backdrop → genre gradient
  const imgSrc = poster ?? backdrop ?? null;
  
  const pathname = usePathname();
  const targetHref = `/vault/${entry.id}?from=${encodeURIComponent(pathname)}`;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={cardSpring.whileHover}
      whileTap={cardSpring.whileTap}
      style={{ willChange: 'transform' }}
    >
      <Link
        href={targetHref}
        className="movie-card"
        aria-label={`${title}${metaText ? `, ${metaText}` : ''}`}
      >
        <div className="movie-card-poster">
          {/* Tier 1 & 2: poster or backdrop image */}
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={`${title} poster`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
              className="movie-card-img"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg=="
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

          {/* Watchlist Bookmark toggle overlay */}
          {movie?.tmdb_id && user && (
            <div
              style={{ position: 'absolute', top: 8, left: 8, zIndex: 6 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <WatchlistButton
                tmdbId={movie.tmdb_id}
                mediaType="movie"
                title={title}
                posterUrl={imgSrc}
                year={year}
                showLabel={false}
                className="watchlist-card-overlay-btn"
              />
            </div>
          )}

          {/* Eye overlay — CSS-driven hover reveal */}
          <div className="movie-card-play" aria-hidden="true">
            <div className="movie-card-play-icon">
              <Eye size={18} color="white" />
            </div>
          </div>

          {/* Bottom strip */}
          <div className="movie-card-bottom">
            <p className="movie-card-title">{title}</p>
            {metaText && <p className="movie-card-year">{metaText}</p>}
          </div>

          {/* Subgenre chip — click filters Vault by subgenre */}
          {subgenre && (
            <span
              className="movie-card-genre-chip"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/vault?subgenre=${encodeURIComponent(subgenre)}`);
              }}
              title={`View all ${subgenre} films`}
            >
              {subgenre}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
