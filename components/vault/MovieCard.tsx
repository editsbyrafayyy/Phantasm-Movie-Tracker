'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { SUBGENRE_HEX } from '@/lib/config';
import { staggerEnter, cardSpring } from '@/lib/motion';
import type { VaultGridEntry } from '@/lib/types';
import { useAuth } from '@/components/layout/AuthProvider';
import WatchlistButton from '@/components/watchlist/WatchlistButton';
import { VERDICT_LABEL, VERDICT_SHORT, verdictColor } from './verdict';
import { formatRuntime } from './format';

interface MovieCardProps {
  entry:            VaultGridEntry;
  /** Position in the rendered list — drives the first-screen stagger and image priority. */
  index:            number;
  /** Eager-load + high fetch priority (first row only). */
  priority?:        boolean;
  selectMode?:      boolean;
  selected?:        boolean;
  onToggleSelect?:  (id: string) => void;
  onSubgenreClick?: (subgenre: string) => void;
}

const BLUR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg==';

function MovieCard({ entry, index, priority = false, selectMode = false, selected = false, onToggleSelect, onSubgenreClick }: MovieCardProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { movie, total, recommend, subgenre } = entry;

  const title    = movie.title ?? 'Unknown';
  const year     = movie.year ?? null;
  const imgSrc   = movie.poster_url ?? movie.backdrop_url ?? null;
  const genreHex = SUBGENRE_HEX[subgenre] ?? '#333333';
  const hasScore = total !== null && total > 0;
  const metaText = [year, formatRuntime(movie.runtime_min)].filter(Boolean).join(' · ');
  const recColor = verdictColor(recommend);
  const recLabel = recommend ? VERDICT_LABEL[recommend] : null;

  const accessibleName = [
    title,
    metaText || null,
    hasScore ? `score ${total} out of 10` : null,
    recLabel ? `verdict ${recLabel}` : null,
  ].filter(Boolean).join(', ');

  const poster = (
    <div className="movie-card-poster">
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          className="movie-card-img"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          placeholder="blur"
          blurDataURL={BLUR}
        />
      ) : (
        <div
          className="movie-card-no-poster"
          style={{ background: `linear-gradient(160deg, var(--surface) 0%, ${genreHex}33 100%)` }}
        >
          <Film size={32} aria-hidden="true" />
        </div>
      )}

      <div className="movie-card-overlay" aria-hidden="true" />

      {hasScore && <span className="movie-card-score" aria-hidden="true">{total}</span>}

      {selectMode && (
        <span className={`movie-card-check${selected ? ' is-checked' : ''}`} aria-hidden="true">
          {selected && <Check size={16} />}
        </span>
      )}

      <div className="movie-card-bottom">
        <p className="movie-card-title">{title}</p>
        <div className="movie-card-meta">
          {metaText && <span className="movie-card-year">{metaText}</span>}
          {recommend && recColor && (
            <span
              className="movie-card-verdict"
              style={{ '--verdict': recColor } as React.CSSProperties}
              title={`Verdict: ${recLabel}`}
              aria-hidden="true"
            >
              <span className="vault-dot" />
              {VERDICT_SHORT[recommend]}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <motion.li
      className={`movie-card-item${selected ? ' is-selected' : ''}`}
      {...staggerEnter(index)}
      whileHover={cardSpring.whileHover}
      whileTap={cardSpring.whileTap}
    >
      {selectMode ? (
        <button
          type="button"
          className="movie-card movie-card-selectable"
          aria-pressed={selected}
          aria-label={`Select ${accessibleName}`}
          onClick={() => onToggleSelect?.(entry.id)}
        >
          {poster}
        </button>
      ) : (
        <Link
          href={`/vault/${entry.id}?from=${encodeURIComponent(pathname)}`}
          className="movie-card"
          aria-label={accessibleName}
        >
          {poster}
        </Link>
      )}

      {/* Overlay controls are siblings of the link — never nested inside it. */}
      {!selectMode && user && movie.tmdb_id && (
        <WatchlistButton
          tmdbId={movie.tmdb_id}
          mediaType="movie"
          title={title}
          posterUrl={imgSrc}
          year={year}
          showLabel={false}
          className="watchlist-card-overlay-btn"
        />
      )}

      {!selectMode && subgenre && onSubgenreClick && (
        <button
          type="button"
          className="movie-card-genre-chip"
          onClick={() => onSubgenreClick(subgenre)}
          aria-label={`Show only ${subgenre} films`}
        >
          {subgenre.replace(' Horror', '').replace(' (Non-Horror)', '')}
        </button>
      )}
    </motion.li>
  );
}

export default memo(MovieCard);
