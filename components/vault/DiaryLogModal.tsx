'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, RotateCcw, MessageSquare, Plus } from 'lucide-react';
import Toast, { type ToastType } from '@/components/ui/Toast';

interface DiaryLogModalProps {
  movieId: string;
  movieTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DiaryLogModal({
  movieId,
  movieTitle,
  isOpen,
  onClose,
  onSuccess,
}: DiaryLogModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [watchedAt, setWatchedAt] = useState(today);
  const [rewatch, setRewatch] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [watchCount, setWatchCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    if (isOpen && movieId) {
      setWatchedAt(today);
      const draftKey = `vault_draft_diary_${movieId}`;
      const saved = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null;
      setQuickNote(saved ?? '');
      fetch(`/api/diary?movie_id=${movieId}&count=true`)
        .then(r => r.json())
        .then(data => {
          const count = data.count ?? 0;
          setWatchCount(count);
          if (count > 0) setRewatch(true);
        })
        .catch(() => {});
    }
  }, [isOpen, movieId, today]);

  function handleNoteChange(val: string) {
    setQuickNote(val);
    if (movieId) {
      const draftKey = `vault_draft_diary_${movieId}`;
      if (val) {
        localStorage.setItem(draftKey, val);
      } else {
        localStorage.removeItem(draftKey);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie_id: movieId,
          watched_at: watchedAt,
          rewatch,
          quick_note: quickNote.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to save log');

      if (movieId && typeof window !== 'undefined') {
        localStorage.removeItem(`vault_draft_diary_${movieId}`);
      }

      setToast({ message: 'Watch logged in your Diary!', type: 'success' });
      if (onSuccess) onSuccess();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vault_diary_updated'));
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error logging watch. Try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="share-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="share-panel diary-log-panel"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ maxWidth: 440 }}
        >
          <div className="share-panel-header">
            <div>
              <span className="backdrop-eyebrow" style={{ fontSize: 10, letterSpacing: 2 }}>
                {watchCount > 0 ? `Watch #${watchCount + 1}` : 'First Watch'}
              </span>
              <h3 className="share-panel-title" style={{ fontSize: 18 }}>Log Watch: {movieTitle}</h3>
            </div>
            <button className="roulette-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Date field */}
            <div className="form-section" style={{ marginBottom: 0 }}>
              <label className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} style={{ color: 'var(--red)' }} />
                <span>Date Watched</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={watchedAt}
                onChange={e => setWatchedAt(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Rewatch toggle */}
            <div
              className="form-section"
              style={{
                marginBottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--surface-2)',
                borderRadius: 10,
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RotateCcw size={16} style={{ color: rewatch ? 'var(--red)' : 'var(--text-muted)' }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block' }}>
                    Rewatch
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Have you watched this film before?
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={rewatch}
                onChange={e => setRewatch(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--red)', cursor: 'pointer' }}
                disabled={loading}
              />
            </div>

            {/* Quick note */}
            <div className="form-section" style={{ marginBottom: 0 }}>
              <label className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={13} style={{ color: 'var(--red)' }} />
                <span>Quick Note <span className="optional">(optional)</span></span>
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  className="form-input notes-textarea"
                  value={quickNote}
                  onChange={e => handleNoteChange(e.target.value.slice(0, 280))}
                  placeholder="Where did you watch it? Who with? Key impression..."
                  rows={3}
                  maxLength={280}
                  disabled={loading}
                />
                <span className="notes-char-count">{quickNote.length}/280</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}
            >
              <Plus size={15} />
              <span>{loading ? 'Logging…' : 'Add to Diary'}</span>
            </button>
          </form>

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onDismiss={() => setToast(null)}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
