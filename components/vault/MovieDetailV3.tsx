'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pencil, Trash2, Star, Film, Pin } from 'lucide-react';
import { SCORE_FIELDS } from '@/lib/config';
import type { Entry } from '@/lib/types';


const RECOMMEND_STYLE: Record<string, { color: string; border: string; bg: string }> = {
  Peak:    { color: '#9b59f5', border: '#9b59f5', bg: 'rgba(155,89,245,0.12)' },
  Yes:     { color: '#52b044', border: '#52b044', bg: 'rgba(82,176,68,0.12)'  },
  No:      { color: '#e63232', border: '#e63232', bg: 'rgba(230,50,50,0.12)'  },
  Garbage: { color: '#6b6b6b', border: '#6b6b6b', bg: 'rgba(107,107,107,0.12)' },
};

interface MovieDetailV3Props {
  entry:   Entry;
  similar: Entry[];
  isOwner: boolean;
  canStream: boolean;
}

export default function MovieDetailV3({ entry, similar, isOwner, canStream }: MovieDetailV3Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [isRecommended, setIsRecommended] = useState(!!entry.owner_recommended);
  const [togglingRec, setTogglingRec] = useState(false);

  const { movie } = entry;

  async function toggleRecommendation() {
    setTogglingRec(true);
    const nextVal = !isRecommended;
    setIsRecommended(nextVal);
    
    try {
      const res = await fetch(`/api/movies/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_recommended: nextVal }),
      });
      
      if (!res.ok) throw new Error('Toggle failed');
      
      setToast({
        msg: nextVal ? "Pinned to Rafay's Recommendations" : "Removed from Rafay's Recommendations",
        ok: true
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsRecommended(!nextVal);
      setToast({ msg: 'Failed to update recommendation. Try again.', ok: false });
    } finally {
      setTogglingRec(false);
    }
  }
  const bgImg    = movie.backdrop_url ?? movie.poster_url ?? null;
  const title    = movie.title ?? 'Unknown';
  const recStyle = entry.recommend ? RECOMMEND_STYLE[entry.recommend] : null;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/movies/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setToast({ msg: 'Entry removed from vault', ok: true });
      setConfirming(false);
      setTimeout(() => router.push('/vault'), 1400);
    } catch {
      setToast({ msg: 'Error deleting entry. Try again.', ok: false });
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="detail-v3-page">

      {/* Fixed back button */}
      <div className="detail-back-bar">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} />
          Back to Vault
        </Link>
      </div>

      {/* ── Backdrop Hero ─────────────────────────────────── */}
      <div className="backdrop-hero">
        {bgImg ? (
          <>
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
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg=="
              />
            </motion.div>
          </>
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
          <p className="backdrop-eyebrow">Vault Entry</p>
          <h1 className="backdrop-title">{title}</h1>

          {/* Genre chips */}
          <div className="backdrop-chips">
            {entry.subgenre && <span className="backdrop-chip">{entry.subgenre}</span>}
            {entry.secondary_tag && <span className="backdrop-chip">{entry.secondary_tag}</span>}
          </div>

          {/* OMDb meta strip — moved above score */}
          <div className="backdrop-meta" style={{ marginBottom: 18 }}>
            {movie.year     && <span>{movie.year}</span>}
            {movie.year && movie.director && <span className="backdrop-meta-sep">·</span>}
            {movie.director && <span>{movie.director}</span>}
            {movie.director && movie.runtime_min && <span className="backdrop-meta-sep">·</span>}
            {movie.runtime_min && <span>{movie.runtime_min} min</span>}
            {movie.runtime_min && movie.imdb_rating && <span className="backdrop-meta-sep">·</span>}
            {movie.imdb_rating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={11} fill="currentColor" /> {movie.imdb_rating} IMDb
              </span>
            )}
          </div>

          {/* Vault score badge + recommend badge — side by side */}
          <div className="backdrop-score-recommend-row">
            {entry.total !== null && entry.total > 0 && (
              <div className="backdrop-vault-score-badge">
                <span className="backdrop-vault-score-label">Vault Score</span>
                <span className="backdrop-score-value">{entry.total}</span>
                <span className="backdrop-score-denom">/ 10</span>
              </div>
            )}

            {entry.recommend && recStyle && (
              <span
                className="backdrop-recommend"
                style={{ color: recStyle.color, borderColor: recStyle.border, background: recStyle.bg }}
              >
                {entry.recommend}
              </span>
            )}
          </div>

          {/* Actions — owner-only */}
          <div className="backdrop-actions">
            {(movie.omdb_id || movie.tmdb_id) && (
              <Link href={canStream ? `/stream/${movie.omdb_id || movie.tmdb_id}` : '/login'} className="btn-watch">
                <Play size={14} fill="white" color="white" />
                Watch Now
              </Link>
            )}
            {isOwner && (
              <>
                <button
                  onClick={toggleRecommendation}
                  className={`btn-edit${isRecommended ? ' active-rec' : ''}`}
                  disabled={togglingRec}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Pin size={14} fill={isRecommended ? 'currentColor' : 'none'} />
                  {isRecommended ? 'Recommended' : 'Recommend'}
                </button>
                <Link href={`/update?id=${entry.id}`} className="btn-edit">
                  <Pencil size={14} />
                  Edit Ratings
                </Link>
                <button
                  className="btn-delete-icon"
                  onClick={() => setConfirming(true)}
                  aria-label="Delete entry"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <div className="detail-overview-grid">
        <div className="detail-overview-main">
          {movie.plot && (
            <p className="detail-plot-v3">{movie.plot}</p>
          )}

          {/* Vault ratings section — labeled clearly for guests */}
          <div className="vault-ratings-section">
            <div className="vault-ratings-header">
              <span className="vault-ratings-label">Vault Ratings</span>
            </div>
            <div className="score-bars">
              {SCORE_FIELDS.map(field => {
                const val = entry[field.key as keyof Entry] as number | null;
                const pct = val !== null ? (val / field.max) * 100 : 0;
                return (
                  <div key={field.key} className="score-bar-row">
                    <span className="score-bar-label">{field.label}</span>
                    <div className="score-bar-track">
                      <motion.div
                        className="score-bar-fill"
                        initial={{ width: '0%' }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                      />
                    </div>
                    <span className="score-bar-val">{val ?? '—'}</span>
                  </div>
                );
              })}
              {/* Bonus */}
              <div className="score-bar-row">
                <span className="score-bar-label">Bonus</span>
                <div className="score-bar-track">
                  <motion.div
                    className="score-bar-fill"
                    initial={{ width: '0%' }}
                    animate={{ width: entry.bonus ? '100%' : '0%' }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                  />
                </div>
                <span className="score-bar-val">{entry.bonus ? '+1' : '0'}</span>
              </div>
            </div>
          </div>

          {/* Cast Subsection */}
          <div className="detail-subsection">
            <h4 className="detail-subsection-title">Cast</h4>
            {movie.cast_list && movie.cast_list.length > 0 ? (
              <div className="cast-row">
                {movie.cast_list.map((castItem, i) => {
                  let parsed: string | { name: string; character?: string | null; profile_path?: string | null } = castItem;
                  if (typeof castItem === 'string') {
                    try {
                      parsed = JSON.parse(castItem);
                    } catch {
                      parsed = castItem;
                    }
                  }
                  
                  const name = typeof parsed === 'string' ? parsed : parsed.name;
                  const character = typeof parsed === 'string' ? null : (parsed.character ?? null);
                  const profilePath = typeof parsed === 'string' ? null : (parsed.profile_path ?? null);

                  return (
                    <div key={i} className="cast-card">
                      <div className="cast-avatar">
                        {profilePath ? (
                          <Image
                            src={profilePath}
                            alt={name}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="48px"
                          />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="cast-info">
                        <p className="cast-name">{name}</p>
                        {character && <p className="cast-character">{character}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="cast-empty">
                No cast information available yet.
              </p>
            )}
          </div>

          {/* More Like This Subsection */}
          <div className="detail-subsection">
            <h4 className="detail-subsection-title">More Like This</h4>
            {similar.length > 0 ? (
              <div className="similar-row">
                {similar.slice(0, 10).map(e => {
                  const simImg = e.movie.poster_url ?? e.movie.backdrop_url ?? null;
                  return (
                    <Link key={e.id} href={`/vault/${e.id}`} className="similar-card">
                      <div className="similar-poster">
                        {simImg ? (
                          <Image
                            src={simImg}
                            alt={e.movie.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 640px) 33vw, 120px"
                          />
                    ) : (
                      <div style={{
                        height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Film size={18} color="rgba(255,255,255,0.1)" />
                      </div>
                    )}
                  </div>
                  <p className="similar-title">{e.movie.title}</p>
                  {e.total !== null && e.total > 0 && (
                    <p className="similar-score">{e.total}</p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="cast-empty">No similar films in the vault yet.</p>
        )}
      </div>

        </div>

        <aside className="detail-overview-side">
          <div className="vault-score-card">
            <span className="vault-score-label">Vault Score</span>
            <div className="vault-score-value">
              {entry.total !== null && entry.total > 0 ? entry.total : '—'}
            </div>
            <span className="vault-score-denom">/ 10</span>
            {entry.recommend && recStyle && (
              <span
                className="vault-score-recommend"
                style={{ color: recStyle.color, borderColor: recStyle.border, background: recStyle.bg }}
              >
                {entry.recommend}
              </span>
            )}
          </div>

          <div className="vault-meta-card">
            <div className="vault-meta-row">
              <span>Year</span>
              <span>{movie.year ?? '—'}</span>
            </div>
            <div className="vault-meta-row">
              <span>Runtime</span>
              <span>{movie.runtime_min ? `${movie.runtime_min} min` : '—'}</span>
            </div>
            <div className="vault-meta-row">
              <span>Director</span>
              <span>{movie.director ?? '—'}</span>
            </div>
            <div className="vault-meta-row">
              <span>IMDb</span>
              <span>{movie.imdb_rating ?? '—'}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Delete Confirm Dialog (owner-only) ────────────── */}
      {isOwner && (
        <AnimatePresence>
          {confirming && (
            <>
              <motion.div
                className="dialog-backdrop"
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', zIndex: 199 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !deleting && setConfirming(false)}
              />
              <div className="dialog-overlay">
                <motion.div
                  className="dialog-panel"
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <h2 className="dialog-title">Remove entry?</h2>
                  <p className="dialog-body">
                    This will permanently delete your rating for <strong>{title}</strong>. This cannot be undone.
                  </p>
                  <div className="dialog-actions">
                    <button
                      className="btn-ghost"
                      onClick={() => setConfirming(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-danger"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* ── Toast ─────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.ok ? 'toast-success' : 'toast-error'} toast-visible`}
            style={{ zIndex: 300 }}
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 30 } }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.18 } }}
          >
            <span className="toast-message">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
