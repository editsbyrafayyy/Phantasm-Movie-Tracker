'use client';

import { Fragment, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { backdropZoom, fadeUp } from '@/lib/motion';
import { SUBGENRE_HEX } from '@/lib/config';
import type { Entry } from '@/lib/types';
import { VERDICT_LABEL, verdictColor } from '../verdict';
import { formatRuntime } from '../format';

const BLUR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg==';

interface DetailHeroProps {
  entry:     Entry;
  backHref:  string;
  backLabel: string;
  /** Action buttons rendered under the score row. */
  actions:   ReactNode;
}

/** Full-bleed backdrop with title, meta, subgenre + tags, score + verdict and the action row. */
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
    formatRuntime(movie.runtime_min),
  ].filter(Boolean) as string[];

  return (
    <header className="vdetail-hero">
      {bgImg ? (
        <motion.div className="vdetail-hero-media" variants={backdropZoom} initial="initial" animate="animate">
          <Image
            src={bgImg}
            alt=""
            fill
            className="vdetail-hero-img"
            sizes="100vw"
            priority
            placeholder="blur"
            blurDataURL={BLUR}
          />
        </motion.div>
      ) : (
        <div className="vdetail-hero-media vdetail-hero-fallback" />
      )}
      <div className="vdetail-hero-shade" aria-hidden="true" />

      <div className="vdetail-hero-inner">
        <Link href={backHref} className="vdetail-back">
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>

        <motion.div className="vdetail-hero-body" variants={fadeUp} initial="initial" animate="animate">
          <h1 className="vdetail-title">{title}</h1>

          {(meta.length > 0 || movie.imdb_rating) && (
            <p className="vdetail-meta">
              {meta.map((m, i) => (
                <Fragment key={m}>
                  {i > 0 && <span className="vdetail-sep" aria-hidden="true">·</span>}
                  <span>{m}</span>
                </Fragment>
              ))}
              {movie.imdb_rating && (
                <>
                  {meta.length > 0 && <span className="vdetail-sep" aria-hidden="true">·</span>}
                  <span className="vdetail-imdb">
                    <Star size={14} fill="currentColor" aria-hidden="true" />
                    {movie.imdb_rating}
                    <span className="vdetail-imdb-src">IMDb</span>
                  </span>
                </>
              )}
            </p>
          )}

          {(entry.subgenre || tags.length > 0) && (
            <div className="vdetail-genre-row">
              {entry.subgenre && (
                <Link
                  href={`/vault?subgenre=${encodeURIComponent(entry.subgenre)}`}
                  className="vdetail-genre"
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
                  className="vdetail-tag"
                  title={`All films tagged ${tag}`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <div className="vdetail-score-row">
            {hasScore ? (
              <p className="vdetail-score" aria-label={`Vault score ${entry.total} out of 10`}>
                <span className="vdetail-score-value">{entry.total}</span>
                <span className="vdetail-score-denom">/ 10</span>
              </p>
            ) : (
              <p className="vdetail-unscored">Not rated yet</p>
            )}
            {entry.recommend && recColor && (
              <span className="vdetail-verdict" style={{ '--verdict': recColor } as React.CSSProperties}>
                <span className="vault-dot" aria-hidden="true" />
                {VERDICT_LABEL[entry.recommend] ?? entry.recommend}
              </span>
            )}
          </div>

          <div className="vdetail-actions">{actions}</div>
        </motion.div>
      </div>
    </header>
  );
}
