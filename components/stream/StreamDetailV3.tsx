'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Play, Star, Plus } from 'lucide-react';
import type { TmdbMovieDetail } from '@/lib/tmdb';
import WatchlistButton from '@/components/watchlist/WatchlistButton';

interface StreamDetailV3Props {
  movie: TmdbMovieDetail;
  imdbId: string | null;
  mediaType?: 'movie' | 'tv';
  /** Computed on the server (release date in the future) — keeps render pure. */
  isComingSoon?: boolean;
}

/** Only allow same-origin relative paths as the back target. */
function safeBackHref(from: string | null): string {
  if (from && from.startsWith('/') && !from.startsWith('//')) return from;
  return '/stream';
}

export default function StreamDetailV3({ movie, imdbId, mediaType = 'movie', isComingSoon = false }: StreamDetailV3Props) {
  const searchParams = useSearchParams();
  const from = safeBackHref(searchParams.get('from'));
  const reduceMotion = useReducedMotion();

  const bgImg = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null;

  const title   = movie.title || movie.name || 'Unknown';
  const year    = (movie.release_date || movie.first_air_date)?.slice(0, 4);
  const runtime = movie.runtime;
  const rating  = movie.vote_average;
  const plot    = movie.overview;
  const isTv    = mediaType === 'tv';
  const seasons = isTv ? (movie.seasons ?? []).filter(s => s.season_number > 0) : [];
  const genres  = movie.genres?.slice(0, 3) ?? [];

  const cast = [...(movie.credits?.cast ?? [])]
    .sort((a, b) => a.order - b.order)
    .slice(0, 8)
    .map(c => ({
      name: c.name,
      character: c.character,
      profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
    }));

  const meta: string[] = [];
  if (year) meta.push(year);
  if (!isTv && runtime) meta.push(`${runtime} min`);
  if (isTv && movie.number_of_seasons) meta.push(`${movie.number_of_seasons} season${movie.number_of_seasons === 1 ? '' : 's'}`);

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="detail-v3-page stream-detail">
      <div className="detail-back-bar">
        <Link href={from} className="back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </Link>
      </div>

      {/* ── Backdrop Hero ─────────────────────────────────── */}
      <div className="backdrop-hero">
        {bgImg ? (
          <motion.div
            className="stream-detail-backdrop"
            initial={reduceMotion ? false : { scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.85, ease }}
          >
            <Image src={bgImg} alt="" fill className="backdrop-hero-img" sizes="100vw" priority />
          </motion.div>
        ) : (
          <div className="stream-detail-backdrop stream-detail-backdrop--empty" />
        )}

        <div className="backdrop-hero-gradient" />

        <motion.div
          className="backdrop-hero-content"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease, delay: 0.25 }}
        >
          <p className="backdrop-eyebrow">{isTv ? 'Series' : 'Film'}</p>
          <h1 className="backdrop-title">{title}</h1>

          {genres.length > 0 && (
            <div className="backdrop-chips">
              {genres.map(g => <span key={g.id} className="backdrop-chip">{g.name}</span>)}
            </div>
          )}

          <div className="backdrop-meta stream-detail-meta">
            {meta.map((m, i) => (
              <span key={m} className="stream-detail-meta-item">
                {i > 0 && <span className="backdrop-meta-sep" aria-hidden="true">·</span>}
                {m}
              </span>
            ))}
            {!!rating && rating > 0 && (
              <span className="stream-detail-meta-item">
                {meta.length > 0 && <span className="backdrop-meta-sep" aria-hidden="true">·</span>}
                <Star size={14} fill="currentColor" aria-hidden="true" />
                {rating.toFixed(1)} <span className="stream-detail-meta-src">TMDB</span>
              </span>
            )}
          </div>

          <div className="backdrop-actions stream-detail-actions">
            {isComingSoon ? (
              <span className="stream-detail-soon">
                Coming soon{movie.release_date ? ` · ${movie.release_date}` : ''}
              </span>
            ) : (
              <Link href={`/stream/${imdbId || movie.id}?type=${mediaType}`} className="btn-primary stream-detail-play">
                <Play size={16} fill="currentColor" aria-hidden="true" />
                Play
              </Link>
            )}
            <Link
              href={imdbId ? `/add?omdbId=${imdbId}&title=${encodeURIComponent(title)}` : `/add?tmdbId=${movie.id}&title=${encodeURIComponent(title)}`}
              className="btn-secondary stream-detail-secondary"
            >
              <Plus size={16} aria-hidden="true" />
              Add to vault
            </Link>
            <WatchlistButton
              tmdbId={movie.id}
              mediaType={mediaType}
              title={title}
              posterUrl={movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null}
              year={Number(year) || null}
              showLabel={true}
              className="stream-detail-secondary"
            />
          </div>
        </motion.div>
      </div>

      <div className="detail-overview-grid">
        <div className="detail-overview-main">
          {plot && <p className="detail-plot-v3">{plot}</p>}

          <div className="detail-subsection">
            <h2 className="detail-subsection-title">Cast</h2>
            {cast.length > 0 ? (
              <div className="cast-row">
                {cast.map((c, i) => (
                  <div key={`${c.name}-${i}`} className="cast-card">
                    <div className="cast-avatar">
                      {c.profile_path ? (
                        <Image src={c.profile_path} alt="" fill className="browse-card-img" sizes="64px" />
                      ) : (
                        c.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="cast-info">
                      <p className="cast-name">{c.name}</p>
                      {c.character && <p className="cast-character">{c.character}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="cast-empty">No cast information available.</p>
            )}
          </div>

          {/* TV: season overview (episode picking happens inside the player) */}
          {seasons.length > 0 && (
            <div className="detail-subsection">
              <h2 className="detail-subsection-title">Seasons</h2>
              <ul className="stream-detail-seasons">
                {seasons.map(s => (
                  <li key={s.id} className="stream-detail-season">
                    <span className="stream-detail-season-name">{s.name}</span>
                    <span className="stream-detail-season-meta">
                      {s.episode_count ? `${s.episode_count} episode${s.episode_count === 1 ? '' : 's'}` : '—'}
                      {s.air_date ? ` · ${s.air_date.slice(0, 4)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="detail-overview-side">
          <div className="vault-meta-card">
            <div className="vault-meta-row">
              <span>Status</span>
              <span>{movie.status ?? '—'}</span>
            </div>
            {movie.genres && movie.genres.length > 0 && (
              <div className="vault-meta-row">
                <span>Genres</span>
                <span>{movie.genres.map(g => g.name).join(', ')}</span>
              </div>
            )}
            <div className="vault-meta-row">
              <span>Year</span>
              <span>{year ?? '—'}</span>
            </div>
            {isTv ? (
              <div className="vault-meta-row">
                <span>Episodes</span>
                <span>{movie.number_of_episodes ?? '—'}</span>
              </div>
            ) : (
              <div className="vault-meta-row">
                <span>Runtime</span>
                <span>{runtime ? `${runtime} min` : '—'}</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
