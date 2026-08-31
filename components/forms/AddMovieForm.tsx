'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import OmdbSearchInput from '@/components/forms/OmdbSearchInput';
import ScoreField      from '@/components/ScoreField';
import RecommendPills  from '@/components/RecommendPills';
import BonusToggle     from '@/components/BonusToggle';
import Toast, { type ToastType } from '@/components/ui/Toast';
import ScoreReveal from '@/components/ui/ScoreReveal';
import { SUBGENRES, SECONDARY_TAGS, SCORE_FIELDS, computeTotal } from '@/lib/config';
import type { MovieFormData, OmdbSearchHit, Entry } from '@/lib/types';

const EMPTY: MovieFormData & { notes: string } = {
  title:        '',
  omdbId:       '',
  subgenre:     '',
  secondaryTag: '',
  recommend:    '',
  atmosphere:   '',
  story:        '',
  characters:   '',
  pacing:       '',
  visuals:      '',
  thrill:       '',
  sound:        '',
  impact:       '',
  bonus:        0,
  notes:        '',
};

export default function AddMovieForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form,    setForm]    = useState<MovieFormData & { notes: string }>(EMPTY);

  useEffect(() => {
    const titleParam = searchParams.get('title') ?? '';
    const omdbIdParam = searchParams.get('omdbId') ?? '';
    const tmdbIdParam = searchParams.get('tmdbId') ?? '';
    const resolvedId = omdbIdParam || (tmdbIdParam ? `tmdb:${tmdbIdParam}` : '');
    if (titleParam || resolvedId) {
      setForm(prev => ({
        ...prev,
        title: titleParam,
        omdbId: resolvedId,
      }));
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [toast,   setToast]   = useState<{ message: string; type: ToastType } | null>(null);
  const [errors,  setErrors]  = useState<Partial<Record<keyof MovieFormData, string>>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{ id: string; title: string } | null>(null);

  // Cache vault titles once on mount — no re-fetching on keystrokes
  const vaultTitlesRef = useRef<{ id: string; title: string }[] | null>(null);
  const dupDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/movies')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Entry[]) => {
        if (Array.isArray(data)) {
          vaultTitlesRef.current = data.map((e: any) => ({
            id: e.id,
            title: e.movie?.title?.toLowerCase() ?? '',
          }));
        }
      })
      .catch(() => {
        // Silently handle — empty list if no entries yet or error
        vaultTitlesRef.current = [];
      });
  }, []);

  useEffect(() => {
    if (dupDebounceRef.current) clearTimeout(dupDebounceRef.current);
    if (!form.title.trim() || form.title.length < 3) {
      setDuplicateWarning(null);
      return;
    }
    dupDebounceRef.current = setTimeout(() => {
      if (!vaultTitlesRef.current) return;
      const q = form.title.toLowerCase().trim();
      const match = vaultTitlesRef.current.find(e => e.title === q);
      setDuplicateWarning(match ?? null);
    }, 400);
    return () => { if (dupDebounceRef.current) clearTimeout(dupDebounceRef.current); };
  }, [form.title]);

  const total = computeTotal(form);

  function set<K extends keyof MovieFormData>(key: K, value: MovieFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function handleOmdbSelect(hit: OmdbSearchHit) {
    set('omdbId', hit.imdbID);
    set('title', hit.title);
  }

  function validate() {
    const newErrors: Partial<Record<keyof MovieFormData, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.subgenre)     newErrors.subgenre = 'Please select a subgenre';
    if (!form.recommend)    newErrors.recommend = 'Please select a recommendation';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setToast({ message: 'Please fix the errors below before submitting.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/add-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        let errMessage = 'Failed to add movie.';
        try {
          const err = await res.json();
          if (err.error) errMessage = err.error;
        } catch { /* use status defaults */ }

        if (res.status === 409) {
          errMessage = 'You have already added this movie to your vault.';
        } else if (res.status === 429) {
          errMessage = 'Too many requests. Please slow down and try again.';
        } else if (res.status === 401) {
          errMessage = 'Your session has expired. Please sign in again.';
        }
        setToast({ message: errMessage, type: 'error' });
        return;
      }
      if (total > 0) {
        setShowReveal(true);
      } else {
        setToast({ message: `"${form.title}" added to your vault!`, type: 'success' });
        setTimeout(() => router.push('/vault'), 1400);
      }
    } catch {
      setToast({ message: 'Network error. Please check your connection and try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="movie-form" noValidate>
      {/* Title + OMDB autocomplete */}
      <div className="form-section">
        <p className="section-label">Film Title</p>
        <OmdbSearchInput
          value={form.title}
          onTitleChange={v => { set('title', v); if (!v) set('omdbId', ''); }}
          onSelect={handleOmdbSelect}
          disabled={loading}
        />
        {errors.title && <p className="field-error">{errors.title}</p>}
        {form.omdbId && (
          <p className="omdb-selected-note">
            OMDB matched — metadata will be saved automatically.{' '}
            <button type="button" className="link-btn" onClick={() => { set('omdbId', ''); }}>
              Clear match
            </button>
          </p>
        )}
        {duplicateWarning && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 10,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(230, 126, 34, 0.1)',
            border: '1px solid rgba(230, 126, 34, 0.35)',
          }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              <strong style={{ color: '#f39c12' }}>Already in your Vault</strong> — &ldquo;{duplicateWarning.title}&rdquo; is already logged.
            </span>
            <Link href={`/vault/${duplicateWarning.id}`} style={{ fontSize: 12, color: '#f39c12', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(243,156,18,0.5)' }}>
              View entry →
            </Link>
          </div>
        )}
      </div>

      {/* Subgenre */}
      <div className="form-section">
        <p className="section-label">Subgenre</p>
        <select
          className="form-input"
          value={form.subgenre}
          onChange={e => set('subgenre', e.target.value)}
          required
          disabled={loading}
          aria-label="Subgenre"
        >
          <option value="">Select a subgenre…</option>
          {SUBGENRES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.subgenre && <p className="field-error">{errors.subgenre}</p>}
      </div>

      {/* Secondary tag */}
      <div className="form-section">
        <p className="section-label">Secondary Tag <span className="optional">(optional)</span></p>
        <select
          className="form-input"
          value={form.secondaryTag}
          onChange={e => set('secondaryTag', e.target.value)}
          disabled={loading}
        >
          <option value="">None</option>
          {SECONDARY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Recommend */}
      <div className="form-section">
        <p className="section-label">Recommendation</p>
        <RecommendPills
          value={form.recommend}
          onChange={v => set('recommend', v)}
          disabled={loading}
        />
        {errors.recommend && <p className="field-error">{errors.recommend}</p>}
      </div>

      {/* Score fields */}
      <div className="form-section">
        <p className="section-label">Score Breakdown</p>
        <div className="score-fields-grid">
          {SCORE_FIELDS.map(f => (
            <ScoreField
              key={f.key}
              id={f.key}
              label={f.label}
              max={f.max}
              value={form[f.key as keyof MovieFormData] as number | ''}
              onChange={v => set(f.key as keyof MovieFormData, v as MovieFormData[keyof MovieFormData])}
              disabled={loading}
            />
          ))}
        </div>
      </div>

      {/* Bonus */}
      <BonusToggle
        value={form.bonus}
        onChange={v => set('bonus', v)}
        disabled={loading}
      />

      {/* Personal Notes */}
      <div className="form-section">
        <p className="section-label">
          Personal Notes <span className="optional">(optional)</span>
        </p>
        <div style={{ position: 'relative' }}>
          <textarea
            className="form-input notes-textarea"
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value.slice(0, 500) }))}
            placeholder="Your thoughts, what stood out, a quote, anything…"
            rows={3}
            disabled={loading}
            maxLength={500}
            aria-label="Personal notes"
          />
          <span className="notes-char-count">{form.notes.length}/500</span>
        </div>
      </div>

      {/* Running total */}
      <div className="total-bar">
        <span className="total-bar-label">RUNNING TOTAL</span>
        <span className={`total-bar-value${total > 0 ? ' active' : ''}`}>
          {total > 0 ? total : '—'}
        </span>
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={loading}
      >
        {loading ? 'Saving…' : 'Add to Vault'}
      </button>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Score Reveal */}
      {showReveal && (
        <ScoreReveal
          total={total}
          title={form.title}
          recommend={form.recommend}
          isUpdate={false}
          onDone={() => router.push('/vault')}
        />
      )}
    </form>
  );
}
