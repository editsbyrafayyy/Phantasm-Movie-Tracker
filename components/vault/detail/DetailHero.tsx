'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { backdropZoom, fadeUp } from '@/lib/motion';
import { SUBGENRE_HEX } from '@/lib/config';
import type { Entry } from '@/lib/types';
import { VERDICT_LABEL, verdictColor } from '../verdict';

const BLUR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg==';

interface DetailHeroProps {
  entry:     Entry;
  backHref:  string;
  backLabel: string;
  /** Action buttons rendered under the score row. */
  actions:   ReactNode;
}

/** Full-bleed backdrop with title, tags, meta, score + verdict and the action row. */
export default function DetailHero({ entry, backHref, backLabel, actions }: DetailHeroProps) {
  const { movie } = entry;
  const title = movie.title ?? 'Unknown';
  const bgImg = movie.backdrop_url ?? movie.poster_url ?? null;
  const hasScore = entry.total !== null && entry.total > 0;
  const recColor = verdictColor(entry.recommend);
  const tags = (entry.secondary_tag ?? '').split(',').map(t => t.trim()).filter(Boolean);
  const meta = [
    movie.year ? String(movie.year) : null,
    movie.director,
    movie.runtime_min ? `${movie.runtime_min} min` : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <div className="detail-back-bar">
        <Link href={backHref} className="back-link">
          <ArrowLeft size={14} aria-hidden="true" />
          {backLabel}
        </Link>
      </div>

      <div className="backdrop-hero">
        {bgImg ? (
          <motion.div className="detail-hero-media" variants={backdropZoom} initial="initial" animate="animate">
            <Image
              src={bgImg}
              alt=""
              fill
              className="detail-hero-img"
              sizes="100vw"
              priority
              placeholder="blur"
              blurDataURL={BLUR}
            />
          </motion.div>
        ) : (
          <div className="detail-hero-media detail-hero-fallback" />
        )}

        <div className="backdrop-hero-gradient" />

        <motion.div className="backdrop-hero-content" variants={fadeUp} initial="initial" animate="animate">
          <p className="backdrop-eyebrow">Vault entry</p>
          <h1 className="detail-hero-title">{title}</h1>

          <div className="backdrop-chips">
            {entry.subgenre && (
              <Link
                href={`/vault?subgenre=${encodeURIComponent(entry.subgenre)}`}
                className="detail-chip"
                title={`All ${entry.subgenre} films`}
              >
                <span className="vault-dot" style={{ background: SUBGENRE_HEX[entry.subgenre] ?? 'var(--red)' }} aria-hidden="true" />
                {entry.subgenre}
              </Link>
            )}
            {tags.map(tag => (
              <Link
                key={tag}
                href={`/vault?tag=${encodeURIComponent(tag)}`}
                className="detail-chip detail-chip-tag"
                title={`All films tagged ${tag}`}
              >
                #{tag}
              </Link>
            ))}
          </div>

          <div className="backdrop-meta detail-hero-meta">
            {meta.map((m, i) => (
              <span key={m}>
                {i > 0 && <span className="backdrop-meta-sep" aria-hidden="true">·</span>}
                {m}
              </span>
            ))}
            {movie.imdb_rating && (
              <span className="detail-imdb">
                {meta.length > 0 && <span className="backdrop-meta-sep" aria-hidden="true">·</span>}
                <Star size={14} fill="currentColor" aria-hidden="true" /> {movie.imdb_rating} IMDb
              </span>
            )}
          </div>

          <div className="backdrop-score-recommend-row">
            {hasScore && (
              <div className="detail-hero-score" aria-label={`Vault score ${entry.total} out of 10`}>
                <span className="backdrop-vault-score-label">Vault score</span>
                <span className="detail-hero-score-line">
                  <span className="backdrop-score-value">{entry.total}</span>
                  <span className="backdrop-score-denom">/10</span>
                </span>
              </div>
            )}
            {entry.recommend && recColor && (
              <span className="verdict-badge" style={{ '--verdict': recColor } as React.CSSProperties}>
                <span className="vault-dot" aria-hidden="true" />
                {VERDICT_LABEL[entry.recommend] ?? entry.recommend}
              </span>
            )}
          </div>

          <div className="backdrop-actions">{actions}</div>
        </motion.div>
      </div>
    </>
  );
}
