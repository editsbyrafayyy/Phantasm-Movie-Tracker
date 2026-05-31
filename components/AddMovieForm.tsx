'use client';

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { SUBGENRES, SECONDARY_TAGS, SCORE_FIELDS } from '@/lib/config';
import type { MovieFormData } from '@/lib/types';
import type { Recommend } from '@/lib/config';
import ScoreField     from './ScoreField';
import RecommendPills from './RecommendPills';
import BonusToggle    from './BonusToggle';
import Toast          from './Toast';
import SectionLabel   from './SectionLabel';
import type { ToastType } from './Toast';

const EMPTY_FORM: MovieFormData = {
  title: '', subgenre: '', secondaryTag: '', recommend: '',
  atmosphere: '', story: '', characters: '', pacing: '',
  visuals: '', thrill: '', sound: '', impact: '', bonus: 0,
};

function calcTotal(data: MovieFormData): number {
  const keys = ['atmosphere','story','characters','pacing','visuals','thrill','sound','impact'] as const;
  const score = keys.reduce((sum, k) => {
    const v = data[k];
    return sum + (typeof v === 'number' ? v : 0);
  }, 0);
  return Math.round((score + data.bonus) * 100) / 100;
}

export default function AddMovieForm() {
  const [form,      setForm]      = useState<MovieFormData>(EMPTY_FORM);
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState<{ message: string; type: ToastType } | null>(null);
  const [secondary, setSecondary] = useState(false);

  const total     = calcTotal(form);
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: `"${form.title}" added! Total: ${data.total}.`, type: 'success' });
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
    <form onSubmit={handleSubmit} noValidate style={{ width: '100%', animation: 'fadeUp 0.55s ease 0.15s forwards', opacity: 0 }}>

      {/* ── Movie Info ── */}
      <SectionLabel text="Movie Info" />

      <div className="form-field">
        <label htmlFor="title-input" className="field-label">Title</label>
        <input
          id="title-input"
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Hereditary"
          className="field-input title-input-field"
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
          {SUBGENRES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Secondary tag — ghost chip + animated expand */}
      <div className="secondary-wrap">
        <button
          type="button"
          className="secondary-toggle"
          onClick={() => setSecondary(p => !p)}
        >
          {secondary ? '↑ Hide secondary tag' : '+ Add secondary tag (optional)'}
        </button>
        <div className={`secondary-expand${secondary ? ' open' : ''}`}>
          <div style={{ minHeight: 0 }}>
            <div className="form-field" style={{ marginTop: '10px' }}>
              <label htmlFor="secondaryTag" className="field-label">Secondary Tag</label>
              <select
                id="secondaryTag"
                value={form.secondaryTag}
                onChange={e => set('secondaryTag', e.target.value)}
                className="field-input field-select"
              >
                <option value="">— None —</option>
                {SECONDARY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommend ── */}
      <SectionLabel text="Recommend?" />
      <RecommendPills value={form.recommend} onChange={(v: Recommend) => set('recommend', v)} />

      {/* ── Scores ── */}
      <SectionLabel text="Scores — Atm & Story max 2, others max 1" />
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

      {/* ── Bonus ── */}
      <BonusToggle value={form.bonus} onChange={v => set('bonus', v)} />

      {/* ── Running Total ── */}
      <div className="running-total">
        <div className="running-total-label">Running Total</div>
        <div key={total} className={`running-total-number${!hasScores ? ' empty' : ''}`}>
          {hasScores ? total.toFixed(2) : '—'}
        </div>
      </div>

      {/* ── Submit ── */}
      <button id="submit-btn" type="submit" disabled={loading} className="btn-submit">
        {loading ? (
          <><Loader2 className="spinner-icon" size={16} /> Adding…</>
        ) : (
          'Add to Sheet →'
        )}
      </button>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </form>
  );
}
