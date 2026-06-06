'use client';

import { useState, useEffect } from 'react';
import Image                   from 'next/image';
import Link                    from 'next/link';
import { useRouter as useNextRouter } from 'next/navigation';
import { Film, ChevronDown, ChevronUp, Pencil, Trash2, Star, ArrowLeft } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast, { type ToastType } from '@/components/ui/Toast';
import { SCORE_FIELDS, RECOMMEND_COLOR, SUBGENRE_COLOR_KEY } from '@/lib/config';
import type { Entry } from '@/lib/types';

interface MovieDetailProps {
  entry: Entry;
}

export default function MovieDetail({ entry }: MovieDetailProps) {
  const router = useNextRouter();
  const { movie, recommend, subgenre, secondary_tag, total, bonus } = entry;

  const [plotExpanded,   setPlotExpanded]   = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [toast,          setToast]          = useState<{ message: string; type: ToastType } | null>(null);
  const [deleting,       setDeleting]       = useState(false);
  const [userId,         setUserId]         = useState<string | null>(null);

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
    });
  }, []);

  const canMutate = userId === entry.user_id;

  const recColor  = recommend ? RECOMMEND_COLOR[recommend] : undefined;
  const genreKey  = SUBGENRE_COLOR_KEY[subgenre] ?? '';
  const maxTotal  = 10; // atmosphere(2) + story(2) + 6×max1 + bonus(1) = 10 theoretical max; 10 is score cap

  async function handleDelete() {
    setDeleting(true);
    setShowConfirm(false);

    try {
      const res = await fetch(`/api/movies/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setToast({ message: 'Removed from vault.', type: 'success' });
      setTimeout(() => router.push('/vault'), 1200);
    } catch {
      setToast({ message: 'Failed to delete. Try again.', type: 'error' });
      setDeleting(false);
    }
  }

  return (
    <div className="detail-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={14} aria-hidden="true" /> Back to Vault
      </Link>
      {/* Two-column layout */}
      <div className="detail-layout">
        {/* LEFT — Poster + OMDB strip */}
        <aside className="detail-poster-col">
          <div className="detail-poster-wrap">
            {movie?.poster_url ? (
              <Image
                src={movie.poster_url}
                alt={`${movie.title} poster`}
                fill
                className="detail-poster-img"
                unoptimized
              />
            ) : (
              <div className="detail-poster-fallback" aria-hidden="true">
                <Film size={48} strokeWidth={0.75} />
              </div>
            )}
          </div>

          {/* OMDB metadata strip */}
          <div className="detail-omdb-strip">
            {[
              movie?.year     && String(movie.year),
              movie?.director,
              movie?.runtime_min && `${movie.runtime_min} min`,
              movie?.imdb_rating && (
                <span key="imdb" className="detail-imdb">
                  <Star size={11} fill="currentColor" aria-hidden="true" /> {movie.imdb_rating}
                </span>
              ),
            ].filter(Boolean).map((item, i, arr) => (
              <span key={i}>
                {item}
                {i < arr.length - 1 && <span className="detail-strip-sep" aria-hidden="true"> · </span>}
              </span>
            ))}
          </div>
        </aside>

        {/* RIGHT — Ratings */}
        <section className="detail-ratings-col">
          {/* Title */}
          <h1 className="detail-title">{movie?.title ?? 'Unknown'}</h1>

          {/* Badges row */}
          <div className="detail-badges">
            {subgenre && (
              <span className="detail-genre-chip" data-genre={genreKey}>{subgenre}</span>
            )}
            {secondary_tag && (
              <span className="detail-tag-chip">{secondary_tag}</span>
            )}
            {recommend && (
              <span
                className="detail-rec-badge"
                style={{ background: `${recColor}22`, borderColor: `${recColor}66`, color: recColor }}
              >
                {recommend}
              </span>
            )}
          </div>

          {/* Score breakdown */}
          <div className="detail-scores">
            {SCORE_FIELDS.map(f => {
              const value = entry[f.key as keyof Entry] as number | null;
              const pct   = value !== null ? (value / f.max) * 100 : 0;
              return (
                <div key={f.key} className="detail-score-row">
                  <span className="detail-score-label">{f.label}</span>
                  <div className="detail-score-bar-wrap">
                    <div
                      className="detail-score-bar-fill"
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={value ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={f.max}
                    />
                  </div>
                  <span className="detail-score-value">
                    {value !== null ? value : '—'}
                  </span>
                </div>
              );
            })}

            {bonus === 1 && (
              <div className="detail-bonus-row">
                <span className="detail-score-label">Bonus</span>
                <span className="detail-score-value">+1</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="detail-total">
            <span className="detail-total-value">{total ?? '—'}</span>
            <span className="detail-total-denom">/ {maxTotal}</span>
          </div>

          {/* OMDB plot — collapsible */}
          {movie?.plot && (
            <div className="detail-plot">
              <p className={`detail-plot-text${plotExpanded ? ' expanded' : ''}`}>
                {movie.plot}
              </p>
              <button
                className="detail-plot-toggle"
                onClick={() => setPlotExpanded(p => !p)}
                aria-expanded={plotExpanded}
              >
                {plotExpanded ? (
                  <><ChevronUp size={13} aria-hidden="true" /> Show less</>
                ) : (
                  <><ChevronDown size={13} aria-hidden="true" /> Read plot</>
                )}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="detail-actions">
            {canMutate && (
              <>
                <a href={`/update?id=${entry.id}`} className="btn-outline">
                  <Pencil size={14} aria-hidden="true" /> Edit Ratings
                </a>
                <button
                  className="btn-outline-danger"
                  onClick={() => setShowConfirm(true)}
                  disabled={deleting}
                >
                  <Trash2 size={14} aria-hidden="true" /> Remove from Vault
                </button>
              </>
            )}
            <a href={`/stream/${movie.omdb_id}`} className="btn-outline" style={{ background: '#e63232', color: 'white', borderColor: '#e63232' }}>
              Watch Now
            </a>
          </div>
        </section>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Remove from vault?"
          body={`"${movie?.title}" will be removed from your vault. This cannot be undone.`}
          confirmLabel="Remove from Vault"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
