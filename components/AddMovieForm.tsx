'use client';

import { useState, useCallback } from 'react';
import { SUBGENRES, SECONDARY_TAGS, SCORE_FIELDS } from '@/lib/config';
import type { MovieFormData } from '@/lib/types';
import type { Recommend } from '@/lib/config';
import ScoreField      from './ScoreField';
import RecommendPills  from './RecommendPills';
import BonusToggle     from './BonusToggle';
import Toast           from './Toast';
import type { ToastType } from './Toast';

// ── Initial form state ────────────────────────────────────────────────────────
const EMPTY_FORM: MovieFormData = {
  title:        '',
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

function calcTotal(data: MovieFormData): number {
  const keys = ['atmosphere','story','characters','pacing','visuals','thrill','sound','impact'] as const;
  const score = keys.reduce((sum, k) => {
    const v = data[k];
    return sum + (typeof v === 'number' ? v : 0);
  }, 0);
  return Math.round((score + data.bonus) * 100) / 100;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AddMovieForm() {
  const [form,    setForm]    = useState<MovieFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState<{ message: string; type: ToastType } | null>(null);
  const [secondary, setSecondary] = useState(false);

  const total = calcTotal(form);
  const hasScores = total > 0;

  function set<K extends keyof MovieFormData>(key: K, value: MovieFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const dismissToast = useCallback(() => setToast(null), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setToast({ message: 'Title is required.', type: 'error' }); return;
    }
    if (!form.subgenre) {
      setToast({ message: 'Please select a subgenre.', type: 'error' }); return;
    }

    setLoading(true);
    setToast(null);

    try {
      const res  = await fetch('/api/add-movie', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setToast({
          message: `"${form.title}" added! Total: ${data.total}. Your sheet will sort next time you open it on desktop.`,
          type:    'success',
        });
        setForm(EMPTY_FORM);
        setSecondary(false);
      } else {
        setToast({ message: data.error ?? 'Something went wrong.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error — please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-form" noValidate>

      {/* ── Movie Info ─────────────────────────────────────────────────────── */}
      <div className="form-section-label">Movie Info</div>

      <div className="form-field">
        <label htmlFor="title" className="field-label">Title</label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Hereditary"
          className="field-input"
          autoComplete="off"
        />
      </div>

      <div className="form-field">
        <label htmlFor="subgenre" className="field-label">Primary Subgenre</label>
        <select
          id="subgenre"
          value={form.subgenre}
          onChange={e => set('subgenre', e.target.value)}
          className="field-input field-select"
        >
          <option value="">— Select subgenre —</option>
          {SUBGENRES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Secondary tag — collapsible */}
      <div className="secondary-wrap">
        <button
          type="button"
          className="secondary-toggle"
          onClick={() => setSecondary(p => !p)}
        >
          {secondary ? '↑ Hide secondary tag' : '+ Add secondary tag (optional)'}
        </button>
        {secondary && (
          <div className="form-field" style={{ marginTop: '10px' }}>
            <label htmlFor="secondaryTag" className="field-label">Secondary Tag</label>
            <select
              id="secondaryTag"
              value={form.secondaryTag}
              onChange={e => set('secondaryTag', e.target.value)}
              className="field-input field-select"
            >
              <option value="">— None —</option>
              {SECONDARY_TAGS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Recommend ─────────────────────────────────────────────────────── */}
      <div className="form-section-label">Recommend?</div>
      <RecommendPills
        value={form.recommend}
        onChange={(v: Recommend) => set('recommend', v)}
      />

      {/* ── Scores ────────────────────────────────────────────────────────── */}
      <div className="form-section-label">
        Scores — Atmosphere &amp; Story max 2, others max 1
      </div>
      <div className="score-grid">
        {SCORE_FIELDS.map(f => (
          <ScoreField
            key={f.key}
            id={`score-${f.key}`}
            label={f.label}
            max={f.max}
            value={form[f.key as keyof MovieFormData] as number | ''}
            onChange={v => set(f.key as keyof MovieFormData, v as never)}
          />
        ))}
      </div>

      {/* ── Bonus ─────────────────────────────────────────────────────────── */}
      <BonusToggle
        value={form.bonus}
        onChange={v => set('bonus', v)}
      />

      {/* ── Running Total ─────────────────────────────────────────────────── */}
      <div className="total-bar">
        <div className="total-label">Running Total</div>
        <div className="total-num" id="running-total">
          {hasScores ? total.toFixed(2) : '—'}
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <button
        id="submit-btn"
        type="submit"
        disabled={loading}
        className="btn-submit"
      >
        {loading ? 'Adding…' : 'Add to Sheet →'}
      </button>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      )}
    </form>
  );
}
