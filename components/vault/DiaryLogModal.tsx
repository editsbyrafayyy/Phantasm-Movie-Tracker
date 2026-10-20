'use client';

import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';

interface DiaryLogModalProps {
  movieId:    string;
  movieTitle: string;
  /** Number of watches already logged (fetched once by the parent). */
  watchCount: number;
  onClose:    () => void;
  /** Called after a successful save; the parent shows the confirmation toast. */
  onSuccess?: () => void;
}

const draftKey = (movieId: string) => `vault_draft_diary_${movieId}`;

function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readDraft(movieId: string): string {
  try { return localStorage.getItem(draftKey(movieId)) ?? ''; } catch { return ''; }
}

/** Log a watch to the diary. Mount only while open. */
export default function DiaryLogModal({ movieId, movieTitle, watchCount, onClose, onSuccess }: DiaryLogModalProps) {
  const [today]                   = useState(localToday);
  const [watchedAt, setWatchedAt] = useState(today);
  const [rewatch, setRewatch]     = useState(watchCount > 0);
  const [quickNote, setQuickNote] = useState(() => readDraft(movieId));
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  function handleNoteChange(val: string) {
    setQuickNote(val);
    try {
      if (val) localStorage.setItem(draftKey(movieId), val);
      else localStorage.removeItem(draftKey(movieId));
    } catch { /* storage blocked */ }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: movieId, watched_at: watchedAt, rewatch, quick_note: quickNote.trim() }),
      });
      if (!res.ok) throw new Error(`Diary save failed (${res.status})`);
      try { localStorage.removeItem(draftKey(movieId)); } catch { /* storage blocked */ }
      window.dispatchEvent(new Event('vault_diary_updated'));
      onSuccess?.();
      onClose();
    } catch {
      setError('Could not log this watch. Try again.');
      setSaving(false);
    }
  }

  return (
    <Modal
      title={<>Log <em className="page-header-accent">a watch</em></>}
      onClose={onClose}
      size="sm"
      className="diary-log-panel"
    >
      <p className="diary-log-sub">
        {movieTitle} · {watchCount > 0 ? `watch #${watchCount + 1}` : 'first watch'}
      </p>

      <form onSubmit={handleSubmit} className="diary-log-form">
        <label className="form-label" htmlFor="diary-watched-at">Date watched</label>
        <input
          id="diary-watched-at"
          type="date"
          className="form-input"
          value={watchedAt}
          max={today}
          onChange={e => setWatchedAt(e.target.value)}
          required
          disabled={saving}
          data-autofocus
        />

        <label className="diary-log-toggle">
          <span>
            <span className="diary-log-toggle-title">Rewatch</span>
            <span className="diary-log-toggle-sub">You have seen this film before</span>
          </span>
          <input
            type="checkbox"
            checked={rewatch}
            onChange={e => setRewatch(e.target.checked)}
            disabled={saving}
          />
        </label>

        <label className="form-label" htmlFor="diary-note">
          Quick note <span className="optional">(optional)</span>
        </label>
        <div className="diary-log-note">
          <textarea
            id="diary-note"
            className="form-input notes-textarea"
            value={quickNote}
            onChange={e => handleNoteChange(e.target.value.slice(0, 280))}
            placeholder="Where, who with, first impression…"
            rows={3}
            maxLength={280}
            disabled={saving}
          />
          <span className="notes-char-count">{quickNote.length}/280</span>
        </div>

        {error && <p className="diary-log-error" role="alert">{error}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Logging…' : 'Add to diary'}
        </button>
      </form>
    </Modal>
  );
}
