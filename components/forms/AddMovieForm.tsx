'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OmdbSearchInput from '@/components/forms/OmdbSearchInput';
import ScoreField      from '@/components/ScoreField';
import RecommendPills  from '@/components/RecommendPills';
import BonusToggle     from '@/components/BonusToggle';
import Toast, { type ToastType } from '@/components/ui/Toast';
import { SUBGENRES, SECONDARY_TAGS, SCORE_FIELDS, computeTotal } from '@/lib/config';
import type { MovieFormData, OmdbSearchHit } from '@/lib/types';

const EMPTY: MovieFormData = {
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
};

export default function AddMovieForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form,    setForm]    = useState<MovieFormData>(EMPTY);

  useEffect(() => {
    const titleParam = searchParams.get('title') ?? '';
    const omdbIdParam = searchParams.get('omdbId') ?? '';
    if (titleParam || omdbIdParam) {
      setForm(prev => ({
        ...prev,
        title: titleParam,
        omdbId: omdbIdParam,
      }));
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState<{ message: string; type: ToastType } | null>(null);
  const [errors,  setErrors]  = useState<Partial<Record<keyof MovieFormData, string>>>({});

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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setToast({ message: 'Please fix the errors below.', type: 'error' });
      return;
    }

    setLoading(true);
    setToast({ message: 'Saving…', type: 'loading' });

    try {
      const res  = await fetch('/api/add-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error ?? 'Something went wrong.', type: 'error' });
        setLoading(false);
        return;
      }

      setToast({ message: 'Added to your vault!', type: 'success' });
      setTimeout(() => router.push('/vault'), 1200);
    } catch {
      setToast({ message: 'Network error. Try again.', type: 'error' });
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
          aria-label="Secondary tag"
        >
          <option value="">None</option>
          {SECONDARY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Recommend */}
      <div className="form-section">
        <p className="section-label">Recommend?</p>
        <RecommendPills
          value={form.recommend}
          onChange={v => set('recommend', v)}
          disabled={loading}
        />
      </div>

      {/* Scores */}
      <div className="form-section">
        <p className="section-label">Scores</p>
        <div className="score-grid">
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

      {/* Running total */}
      <div className="total-bar">
        <span className="total-bar-label">RUNNING TOTAL</span>
        <span className={`total-bar-value${total > 0 ? ' active' : ''}`}>
          {total > 0 ? total : '—'}
        </span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn-primary"
        disabled={loading}
      >
        {loading ? 'Saving…' : 'Add to Vault'}
      </button>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </form>
  );
}
