'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, RotateCcw, Trash2, Calendar, BookOpen, Search } from 'lucide-react';
import Toast, { type ToastType } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface DiaryItem {
  id: string;
  watched_at: string;
  rewatch: boolean;
  quick_note?: string | null;
  movie?: {
    id: string;
    title: string;
    poster_url?: string | null;
    year?: number | null;
  } | null;
}

interface DiaryFeedClientProps {
  initialDiary: DiaryItem[];
}

export default function DiaryFeedClient({ initialDiary }: DiaryFeedClientProps) {
  const [diary, setDiary] = useState<DiaryItem[]>(initialDiary);
  const [filterRewatch, setFilterRewatch] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const filtered = diary.filter(item => {
    if (filterRewatch !== null && item.rewatch !== filterRewatch) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = item.movie?.title?.toLowerCase() ?? '';
      const note = item.quick_note?.toLowerCase() ?? '';
      return title.includes(q) || note.includes(q);
    }
    return true;
  });

  async function handleDelete() {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/diary?id=${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setDiary(prev => prev.filter(d => d.id !== deletingId));
      setToast({ message: 'Watch log removed', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete log', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  }

  if (diary.length === 0) {
    return (
      <div className="diary-empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <BookOpen size={48} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 16 }} />
        <h3 style={{ fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>Your Diary is Empty</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px' }}>
          Start logging your horror movie viewings and rewatches directly from any movie page in your vault.
        </p>
        <Link href="/vault" className="btn-primary" style={{ display: 'inline-flex', gap: 8 }}>
          Browse Vault
        </Link>
      </div>
    );
  }

  return (
    <div className="diary-feed-wrapper">
      {/* Controls / Filter Bar */}
      <div className="diary-controls" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search diary entries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
          />
        </div>

        <div className="diary-filter-chips" style={{ display: 'flex', gap: 6 }}>
          <button
            className={`btn-edit ${filterRewatch === null ? 'active' : ''}`}
            onClick={() => setFilterRewatch(null)}
            style={{ height: 38, fontSize: 12 }}
          >
            All ({diary.length})
          </button>
          <button
            className={`btn-edit ${filterRewatch === true ? 'active' : ''}`}
            onClick={() => setFilterRewatch(true)}
            style={{ height: 38, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <RotateCcw size={12} /> Rewatches ({diary.filter(d => d.rewatch).length})
          </button>
        </div>
      </div>

      {/* Feed list */}
      <div className="diary-feed-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(item => {
          const dateObj = new Date(item.watched_at);
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div key={item.id} className="diary-item-card" style={{ display: 'flex', gap: 16, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, alignItems: 'center' }}>
              {/* Date */}
              <div className="diary-item-date" style={{ minWidth: 90, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {formattedDate}
                </span>
              </div>

              {/* Poster */}
              <div className="diary-item-poster" style={{ width: 44, height: 64, borderRadius: 6, overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'var(--surface-2)' }}>
                {item.movie?.poster_url ? (
                  <Image
                    src={item.movie.poster_url}
                    alt={item.movie.title}
                    fill
                    sizes="44px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Film size={16} color="var(--text-muted)" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="diary-item-info" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={`/vault/${item.movie?.id}`} style={{ textDecoration: 'none' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                      {item.movie?.title ?? 'Unknown Film'}
                    </h4>
                  </Link>
                  {item.movie?.year && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({item.movie.year})</span>
                  )}
                  {item.rewatch && (
                    <span className="diary-rewatch-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--red)', background: 'rgba(230,50,50,0.12)', border: '1px solid rgba(230,50,50,0.3)', padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase' }}>
                      <RotateCcw size={10} /> Rewatch
                    </span>
                  )}
                </div>

                {item.quick_note && (
                  <p style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    &ldquo;{item.quick_note}&rdquo;
                  </p>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => setDeletingId(item.id)}
                className="btn-delete-icon"
                title="Remove log entry"
                style={{ opacity: 0.6 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {deletingId && (
        <ConfirmDialog
          title="Delete watch log?"
          body="Are you sure you want to remove this viewing from your diary?"
          confirmLabel="Remove Log"
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}

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
