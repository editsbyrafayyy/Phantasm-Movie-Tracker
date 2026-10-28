'use client';

import { Fragment, useEffect, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Play, Plus, Star } from 'lucide-react';
import { backdropZoom, fadeUp } from '@/lib/motion';
import { extractDominantColor } from '@/lib/posterColor';
import type { TmdbMovieDetail } from '@/lib/tmdb';
import CastRow from '@/components/vault/detail/CastRow';
import WatchlistButton from '@/components/watchlist/WatchlistButton';

const BLUR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg==';

/** TMDB returns crew + language too; only the fields used here are typed. */
type Detail = TmdbMovieDetail & {
  credits?: TmdbMovieDetail['credits'] & { crew?: { job: string; name: string }[] };
  spoken_languages?: { english_name?: string }[];
  vote_count?: number;
  created_by?: { name: string }[];
};

interface StreamDetailV3Props {
  movie: Detail;
  imdbId: string | null;
  mediaType?: 'movie' | 'tv';
  /** YYYY-MM-DD when the title hasn't been released yet (computed on the server). */
  upcomingRelease?: string | null;
  /** Server date (YYYY-MM-DD) for the first render; the viewer's local date replaces it. */
  today?: string;
  /** Signed in — guests are sent to /login before the player. */
  canStream?: boolean;
}

/** Only allow same-origin relative paths as the back target. */
function safeBackHref(from: string | null): string {
  if (from && from.startsWith('/') && !from.startsWith('//')) return from;
  return '/stream';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "10 Mar 2027" from YYYY-MM-DD (no locale/timezone drift). */
function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m) return iso;
  return d ? `${d} ${MONTHS[m - 1]} ${y}` : `${MONTHS[m - 1]} ${y}`;
}

/** "1h 52m" — same format as the vault detail page. */
function formatRuntime(min: number | null | undefined): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

/** Lift near-black poster colours so the ambient glow is still visible (as on vault detail). */
function boostColor(rgb: string | null): string {
  if (!rgb) return 'transparent';
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  const [r, g, b] = [+match[1], +match[2], +match[3]];
  return 0.299 * r + 0.587 * g + 0.114 * b < 25 ? 'rgb(180, 30, 30)' : rgb;
}

const noSubscribe = () => () => {};
function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function countdownLabel(release: string | null, today: string): string | null {
  if (!release || !today) return null;
  const days = Math.round(
    (new Date(`${release}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000,
  );
  if (!Number.isFinite(days) || days < 0) return null;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return days < 60 ? `in ${days} days` : null;
}

export default function StreamDetailV3({
  movie,
  imdbId,
  mediaType = 'movie',
  upcomingRelease = null,
  today: serverToday = '',
  canStream = false,
}: StreamDetailV3Props) {
  const searchParams = useSearchParams();
  const from = safeBackHref(searchParams.get('from'));

  const bgImg = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : null;

  const title    = movie.title || movie.name || 'Unknown';
  const released = movie.release_date || movie.first_air_date || '';
  const year     = released.slice(0, 4);
  const runtime  = movie.runtime;
  const rating   = movie.vote_average;
  const isTv     = mediaType === 'tv';
  const seasons  = isTv ? (movie.seasons ?? []).filter(s => s.season_number > 0) : [];
  const genres   = movie.genres?.slice(0, 3) ?? [];
  const director = isTv
    ? movie.created_by?.map(c => c.name).slice(0, 2).join(', ') || null
    : movie.credits?.crew?.find(c => c.job === 'Director')?.name ?? null;
  const language = movie.spoken_languages?.[0]?.english_name ?? null;

  const cast = [...(movie.credits?.cast ?? [])]
    .sort((a, b) => a.order - b.order)
    .slice(0, 10)
    .map(c => ({
      name: c.name,
      character: c.character || null,
      profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
    }));

  const meta = [
    year || null,
    director,
    !isTv ? formatRuntime(runtime) : null,
    isTv && movie.number_of_seasons
      ? `${movie.number_of_seasons} season${movie.number_of_seasons === 1 ? '' : 's'}`
      : null,
  ].filter(Boolean) as string[];

  // Player URL format is fixed: /stream/<imdbId|tmdbId>?type=<movie|tv>
  const playerHref = `/stream/${imdbId || movie.id}?type=${mediaType}`;
  const playHref = canStream ? playerHref : `/login?next=${encodeURIComponent(playerHref)}`;
  const addHref = imdbId
    ? `/add?omdbId=${imdbId}&title=${encodeURIComponent(title)}`
    : `/add?tmdbId=${movie.id}&type=${mediaType}&title=${encodeURIComponent(title)}`;
  const today = useSyncExternalStore(noSubscribe, localToday, () => serverToday);
  const countdown = countdownLabel(upcomingRelease, today);

  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null;
  const [ambientColor, setAmbientColor] = useState<string | null>(null);
  useEffect(() => {
    const src = posterUrl ?? bgImg;
    if (!src) return;
    let alive = true;
    extractDominantColor(src).then(color => { if (alive && color) setAmbientColor(color); });
    return () => { alive = false; };
  }, [posterUrl, bgImg]);

  const facts: [string, string][] = [
    ['Status', movie.status ?? null],
    [upcomingRelease ? 'Release' : isTv ? 'First aired' : 'Released', released ? formatDate(released) : null],
    isTv
      ? ['Episodes', movie.number_of_episodes ? String(movie.number_of_episodes) : null]
      : ['Runtime', formatRuntime(runtime)],
    [isTv ? 'Created by' : 'Director', director],
    ['Language', language],
    ['TMDB', rating && rating > 0
      ? `${rating.toFixed(1)} / 10${movie.vote_count ? ` · ${movie.vote_count.toLocaleString('en-US')} votes` : ''}`
      : null],
  ].filter((f): f is [string, string] => !!f[1]);

  return (
    <div className="vdetail stream-detail">
      <div
        className={`vdetail-ambient${ambientColor ? ' is-lit' : ''}`}
        style={{ '--glow-color': boostColor(ambientColor) } as React.CSSProperties}
        aria-hidden="true"
      />

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
          <Link href={from} className="vdetail-back">
            <ArrowLeft size={16} aria-hidden="true" />
            {from === '/stream' ? 'Back to stream' : 'Back'}
          </Link>

          <motion.div className="vdetail-hero-body" variants={fadeUp} initial="initial" animate="animate">
            <h1 className="vdetail-title">{title}</h1>

            {(meta.length > 0 || (rating && rating > 0)) && (
              <p className="vdetail-meta">
                {meta.map((m, i) => (
                  <Fragment key={m}>
                    {i > 0 && <span className="vdetail-sep" aria-hidden="true">·</span>}
                    <span>{m}</span>
                  </Fragment>
                ))}
                {!!rating && rating > 0 && (
                  <>
                    {meta.length > 0 && <span className="vdetail-sep" aria-hidden="true">·</span>}
                    <span className="vdetail-imdb">
                      <Star size={14} fill="currentColor" aria-hidden="true" />
                      {rating.toFixed(1)}
                      <span className="vdetail-imdb-src">TMDB</span>
                    </span>
                  </>
                )}
              </p>
            )}

            {genres.length > 0 && (
              <div className="vdetail-genre-row">
                {genres.map(g => <span key={g.id} className="vdetail-genre is-static">{g.name}</span>)}
              </div>
            )}

            <div className="vdetail-actions">
              {upcomingRelease ? (
                <p className="stream-detail-release">
                  <span className="stream-detail-release-label">Release</span>
                  <time dateTime={upcomingRelease} className="stream-detail-release-date">
                    {formatDate(upcomingRelease)}
                  </time>
                  {countdown && <span className="stream-detail-release-countdown">{countdown}</span>}
                </p>
              ) : (
                <Link
                  href={playHref}
                  className="btn-primary vdetail-watch-btn"
                  title={canStream ? undefined : 'Sign in to play'}
                >
                  <Play size={16} fill="currentColor" aria-hidden="true" />
                  Play
                </Link>
              )}

              {canStream && (
                <>
                  <Link href={addHref} className="btn-secondary" title="Rate this title in your vault">
                    <Plus size={16} aria-hidden="true" />
                    Add to vault
                  </Link>
                  <WatchlistButton
                    tmdbId={movie.id}
                    mediaType={mediaType}
                    title={title}
                    posterUrl={posterUrl}
                    year={Number(year) || null}
                    showLabel={true}
                    className="btn-secondary stream-detail-watchlist"
                  />
                </>
              )}
            </div>
          </motion.div>
        </div>
      </header>

      <div className="vdetail-body">
        <div className="vdetail-top">
          {movie.overview && <p className="vdetail-plot">{movie.overview}</p>}
        </div>

        {facts.length > 0 && (
          <aside className="vdetail-side" aria-labelledby="stream-detail-facts-heading">
            <h2 id="stream-detail-facts-heading" className="vdetail-side-title">Details</h2>
            <dl className="vdetail-facts">
              {facts.map(([k, v]) => (
                <div key={k} className="vdetail-fact">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </aside>
        )}

        <div className="vdetail-rest">
          <CastRow cast={cast} />

          {/* TV: season list (episodes are picked inside the player) */}
          {seasons.length > 0 && (
            <section className="vdetail-section" aria-labelledby="stream-detail-seasons-heading">
              <h2 id="stream-detail-seasons-heading" className="vdetail-h2">Seasons</h2>
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
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
