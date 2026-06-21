'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Play, Star } from 'lucide-react';
import type { TmdbMovieDetail } from '@/lib/tmdb';
import WatchlistButton from '@/components/watchlist/WatchlistButton';

interface StreamDetailV3Props {
  movie: TmdbMovieDetail;
  imdbId: string | null;
  mediaType?: 'movie' | 'tv';
}

export default function StreamDetailV3({ movie, imdbId, mediaType = 'movie' }: StreamDetailV3Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/stream';

  const isComingSoon = movie.release_date 
    ? new Date(movie.release_date).getTime() > Date.now()
    : false;

  const bgImg = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` 
    : movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : null;
  
  const title = movie.title || movie.name || 'Unknown';
  const year = (movie.release_date || movie.first_air_date)?.slice(0, 4);
  const runtime = movie.runtime;
  const rating = movie.vote_average;
  const plot = movie.overview;
  
  const cast = movie.credits?.cast
    ?.sort((a, b) => a.order - b.order)
    .slice(0, 8)
    .map(c => ({
      name: c.name,
      character: c.character,
      profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
    })) ?? [];

  return (
    <div className="detail-v3-page">
      {/* Fixed back button */}
      <div className="detail-back-bar">
        <Link href={from} className="back-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeft size={15} />
          Go Back
        </Link>
      </div>

      {/* ── Backdrop Hero ─────────────────────────────────── */}
      <div className="backdrop-hero">
        {bgImg ? (
          <motion.div
            style={{ position: 'absolute', inset: 0 }}
            initial={{ scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={bgImg}
              alt={`${title} backdrop`}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
              sizes="100vw"
              priority
            />
          </motion.div>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, #111 0%, #1a0808 100%)',
          }} />
        )}

        <div className="backdrop-hero-gradient" />

        <motion.div
          className="backdrop-hero-content"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        >
          <p className="backdrop-eyebrow">Movie Overview</p>
          <h1 className="backdrop-title">{title}</h1>

          {/* Meta strip */}
          <div className="backdrop-meta" style={{ marginBottom: 18 }}>
            {year && <span>{year}</span>}
            {year && runtime && <span className="backdrop-meta-sep">·</span>}
            {runtime && <span>{runtime} min</span>}
            {runtime && rating && <span className="backdrop-meta-sep">·</span>}
            {rating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={11} fill="currentColor" /> {rating.toFixed(1)} TMDB
              </span>
            )}
          </div>

          <div className="backdrop-actions">
            {!isComingSoon && (
              <Link href={`/stream/${imdbId || movie.id}?type=${mediaType}`} className="btn-watch">
                <Play size={14} fill="white" color="white" />
                Watch Now
              </Link>
            )}
            <WatchlistButton
              tmdbId={movie.id}
              mediaType={mediaType}
              title={title}
              posterUrl={movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null}
              year={Number(year) || null}
              showLabel={true}
            />
          </div>
        </motion.div>
      </div>

      <div className="detail-overview-grid">
        <div className="detail-overview-main">
          {plot && (
            <p className="detail-plot-v3">{plot}</p>
          )}

          {/* Cast Subsection */}
          <div className="detail-subsection">
            <h4 className="detail-subsection-title">Cast</h4>
            {cast.length > 0 ? (
              <div className="cast-row">
                {cast.map((c, i) => (
                  <div key={i} className="cast-card">
                    <div className="cast-avatar">
                      {c.profile_path ? (
                        <Image
                          src={c.profile_path}
                          alt={c.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="48px"
                        />
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
            <div className="vault-meta-row">
              <span>Runtime</span>
              <span>{runtime ? `${runtime} min` : '—'}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
