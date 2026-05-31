'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import ScoreField     from './ScoreField';
import RecommendPills from './RecommendPills';
import BonusToggle    from './BonusToggle';
import Toast          from './Toast';
import SectionLabel   from './SectionLabel';
import { Search, Loader2 } from 'lucide-react';
import { SCORE_FIELDS, type ScoreKey, type Recommend } from '@/lib/config';
import type { MovieFormData } from '@/lib/types';

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <span style={{ fontFamily: 'var(--font-sans)' }}>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span style={{ fontFamily: 'var(--font-sans)' }}>{text}</span>;
  const before = text.slice(0, idx);
  const match  = text.slice(idx, idx + query.length);
  const after  = text.slice(idx + query.length);
  return (
    <>
      <span style={{ fontFamily: 'var(--font-sans)' }}>{before}</span>
      <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#fff' }}>{match}</em>
      <span style={{ fontFamily: 'var(--font-sans)' }}>{after}</span>
    </>
  );
}

export default function UpdateMovieForm() {
  const [titles,          setTitles]          = useState<string[]>([]);
  const [filter,          setFilter]          = useState('');
  const [selectedTitle,   setSelectedTitle]   = useState('');
  const [isLoadingTitles, setIsLoadingTitles] = useState(true);
  const [isLoadingMovie,  setIsLoadingMovie]  = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);
  const [showForm,        setShowForm]        = useState(false);
  const [loadedTitle,     setLoadedTitle]     = useState('');

  const [scores, setScores] = useState<Record<ScoreKey, number | ''>>({
    atmosphere: '', story: '', characters: '', pacing: '',
    visuals: '', thrill: '', sound: '', impact: '',
  });
  const [bonus,     setBonus]     = useState<0 | 1>(0);
  const [recommend, setRecommend] = useState<Recommend>('');
  const [subgenre,     setSubgenre]     = useState('');
  const [secondaryTag, setSecondaryTag] = useState('');
  const [toast,     setToast]     = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const listRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── 1. Fetch titles ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/movie-titles')
      .then(r => r.json())
      .then(d => { if (d.success) setTitles(d.titles); setIsLoadingTitles(false); })
      .catch(() => setIsLoadingTitles(false));
  }, []);

  // ── 2. Filter ──────────────────────────────────────────────────────────────
  const filteredTitles = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return titles;
    return titles.filter(t => t.toLowerCase().includes(q));
  }, [filter, titles]);

  // ── 3. Auto-scroll selected item into view ─────────────────────────────────
  useEffect(() => {
    if (!listRef.current || !selectedTitle) return;
    const el = listRef.current.querySelector<HTMLDivElement>('.movie-list-item.selected');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedTitle]);

  // ── 4. Load movie data ─────────────────────────────────────────────────────
  const handleLoad = async (overrideTitle?: string) => {
    const target = overrideTitle ?? selectedTitle;
    if (!target) { setToast({ message: 'Please select a movie first.', type: 'error' }); return; }

    setIsLoadingMovie(true);
    setToast(null);
    setShowForm(false);

    try {
      const res  = await fetch(`/api/movie-data?title=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setScores({
        atmosphere: data.data.atmosphere, story:      data.data.story,
        characters: data.data.characters, pacing:     data.data.pacing,
        visuals:    data.data.visuals,    thrill:     data.data.thrill,
        sound:      data.data.sound,      impact:     data.data.impact,
      });
      setBonus(data.data.bonus);
      setRecommend(data.data.recommend);
      setSubgenre(data.data.subgenre ?? '');
      setSecondaryTag(data.data.secondaryTag ?? '');
      if (overrideTitle) setSelectedTitle(overrideTitle);
      setLoadedTitle(target);
      setShowForm(true);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to load', type: 'error' });
    } finally {
      setIsLoadingMovie(false);
    }
  };

  // ── 5. Total ───────────────────────────────────────────────────────────────
  const currentTotal = useMemo(() => {
    const sum = Object.values(scores).reduce<number>((a, v) => a + (typeof v === 'number' ? v : 0), 0);
    return Math.round((sum + bonus) * 100) / 100;
  }, [scores, bonus]);

  // ── 6. Save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setToast(null);
    const payload: MovieFormData = {
      title: selectedTitle,
      subgenre: subgenre || 'Psychological Horror',
      secondaryTag: secondaryTag,
      recommend,
      bonus,
      ...scores,
    };
    try {
      const res  = await fetch('/api/update-movie', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: `Saved! New total: ${data.total}`, type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to save', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error. Try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── 7. Keyboard nav in search box ─────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = filteredTitles.indexOf(selectedTitle);
      const next = idx < filteredTitles.length - 1 ? filteredTitles[idx + 1] : filteredTitles[0];
      if (next) setSelectedTitle(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = filteredTitles.indexOf(selectedTitle);
      const prev = idx > 0 ? filteredTitles[idx - 1] : filteredTitles[filteredTitles.length - 1];
      if (prev) setSelectedTitle(prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = selectedTitle || filteredTitles[0];
      if (target) handleLoad(target);
    }
  };

  return (
    <div style={{ width: '100%', animation: 'fadeUp 0.55s ease 0.15s forwards', opacity: 0 }}>

      {/* ── Movie Picker ─────────────────────────────────────────────────── */}
      <div className="movie-picker-panel">
        {/* Search */}
        <div className="search-input-wrap">
          <Search className="search-icon" size={16} />
          <input
            ref={searchRef}
            type="text"
            className="field-input search-input-inner"
            placeholder="Search your vault…"
            value={filter}
            onChange={e => { setFilter(e.target.value); setSelectedTitle(''); }}
            onKeyDown={handleKeyDown}
            disabled={isLoadingMovie}
            autoComplete="off"
          />
        </div>

        {/* Custom list */}
        <div className="movie-list" ref={listRef}>
          {isLoadingTitles ? (
            <div className="movie-list-empty">Loading your vault…</div>
          ) : filteredTitles.length === 0 ? (
            <div className="movie-list-empty">No movies match "{filter}"</div>
          ) : (
            filteredTitles.map(t => (
              <div
                key={t}
                className={`movie-list-item${t === selectedTitle ? ' selected' : ''}`}
                onClick={() => setSelectedTitle(t)}
                onDoubleClick={() => handleLoad(t)}
              >
                {highlightMatch(t, filter)}
              </div>
            ))
          )}
        </div>

        {/* Load button */}
        <button
          className="btn-ghost"
          onClick={() => handleLoad()}
          disabled={!selectedTitle || isLoadingMovie || isLoadingTitles}
        >
          {isLoadingMovie ? (
            <><Loader2 className="spinner-icon" size={16} /> Loading…</>
          ) : (
            'Load Movie Data'
          )}
        </button>
      </div>

      {/* ── Loaded form ──────────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ marginTop: 32, animation: 'fadeUp 0.4s ease forwards' }}>
          <p className="loaded-title">
            Editing: <em>{loadedTitle}</em>
          </p>

          <SectionLabel text="Recommend?" />
          <RecommendPills value={recommend} onChange={setRecommend} />

          <SectionLabel text="Scores — Atm & Story max 2, others max 1" />
          <div className="score-grid">
            {SCORE_FIELDS.map(f => (
              <ScoreField
                key={f.key}
                id={`update-${f.key}`}
                label={f.label}
                max={f.max}
                value={scores[f.key]}
                onChange={newVal => setScores(s => ({ ...s, [f.key]: newVal }))}
              />
            ))}
          </div>

          <BonusToggle value={bonus} onChange={setBonus} />

          <div className="running-total">
            <div className="running-total-label">Running Total</div>
            <div key={currentTotal} className="running-total-number">
              {currentTotal.toFixed(2)}
            </div>
          </div>

          <button className="btn-submit" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save to Sheet →'}
          </button>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
