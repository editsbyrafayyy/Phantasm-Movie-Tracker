'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast, { type ToastType } from '@/components/ui/Toast';
import FranchiseTrack from '@/components/vault/FranchiseTrack';
import ListManagerModal from '@/components/vault/ListManagerModal';
import DetailHero from '@/components/vault/detail/DetailHero';
import DetailActions from '@/components/vault/detail/DetailActions';
import EntryTags from '@/components/vault/detail/EntryTags';
import CastRow from '@/components/vault/detail/CastRow';
import SimilarRow from '@/components/vault/detail/SimilarRow';
import DetailSidebar from '@/components/vault/detail/DetailSidebar';
import { extractDominantColor } from '@/lib/posterColor';
import type { Entry, RelatedEntry } from '@/lib/types';

/** Lift near-black poster colours so the ambient glow is still visible. */
function boostColor(rgb: string | null): string {
  if (!rgb) return 'transparent';
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  const [r, g, b] = [+match[1], +match[2], +match[3]];
  return 0.299 * r + 0.587 * g + 0.114 * b < 25 ? 'rgb(180, 30, 30)' : rgb;
}

interface MovieDetailV3Props {
  entry:            Entry;
  /** Same-subgenre entries, closest score first (server-computed). */
  similar:          RelatedEntry[];
  /** Entries in the same franchise, including this one (server-computed). */
  franchiseEntries: RelatedEntry[];
  isOwner:          boolean;
  isSiteOwner?:     boolean;
  canStream:        boolean;
  /** The signed-in member's own rating of this film, when viewing someone else's entry. */
  viewerEntry?:     { id: string; total: number | null } | null;
}

type ToastState = { message: string; type: ToastType; onUndo?: () => void } | null;

export default function MovieDetailV3({ entry, similar, franchiseEntries, isOwner, isSiteOwner = false, canStream, viewerEntry = null }: MovieDetailV3Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/vault';
  const { movie } = entry;
  const title = movie.title ?? 'Unknown';

  const [confirming, setConfirming]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [toast, setToast]             = useState<ToastState>(null);
  const [mustWatch, setMustWatch]     = useState(!!entry.must_watch);
  const [togglingMustWatch, setTogglingMustWatch] = useState(false);
  const [stackOpen, setStackOpen]     = useState(false);
  const [ambientColor, setAmbientColor] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const poster = movie?.poster_url ?? movie?.backdrop_url;
    if (!poster) return;
    extractDominantColor(poster).then(color => {
      if (alive && color) setAmbientColor(color);
    });
    return () => { alive = false; };
  }, [movie?.poster_url, movie?.backdrop_url]);

  // Recently viewed (read by the home page).
  useEffect(() => {
    if (!entry.id || !movie) return;
    try {
      const key = 'vault_recently_viewed';
      const existing = JSON.parse(localStorage.getItem(key) || '[]') as { id: string }[];
      const updated = [
        {
          id: entry.id,
          title: movie.title ?? 'Unknown',
          poster_url: movie.poster_url ?? movie.backdrop_url ?? null,
          year: movie.year ?? null,
          total: entry.total ?? null,
          viewedAt: Date.now(),
        },
        ...existing.filter(item => item.id !== entry.id),
      ].slice(0, 10);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch { /* storage unavailable */ }
  }, [entry.id, entry.total, movie]);

  async function patchMustWatch(value: boolean) {
    const res = await fetch(`/api/movies/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ must_watch: value }),
    });
    if (!res.ok) throw new Error('Toggle failed');
  }

  async function toggleMustWatch() {
    const next = !mustWatch;
    setTogglingMustWatch(true);
    setMustWatch(next);
    try {
      await patchMustWatch(next);
      setToast({
        message: next ? 'Marked must watch' : 'Removed from must watch',
        type: 'success',
        onUndo: async () => {
          setMustWatch(!next);
          try {
            await patchMustWatch(!next);
            router.refresh();
          } catch {
            setMustWatch(next);
            setToast({ message: 'Could not undo. Try again.', type: 'error' });
          }
        },
      });
      router.refresh();
    } catch {
      setMustWatch(!next);
      setToast({ message: 'Could not update. Try again.', type: 'error' });
    } finally {
      setTogglingMustWatch(false);
    }
  }

  async function copyText(text: string, ok: string, fail: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: ok, type: 'success' });
    } catch {
      setToast({ message: fail, type: 'error' });
    }
  }

  function copySummary() {
    const rec = entry.recommend ? ` [${entry.recommend}]` : '';
    const score = entry.total !== null && entry.total > 0 ? ` — ${entry.total}/10` : '';
    const year = movie.year ? ` (${movie.year})` : '';
    void copyText(`${title}${year}${score}${rec} on Phantasm`, 'Summary copied', 'Could not copy summary');
  }

  function copyLink() {
    void copyText(`${window.location.origin}/vault/${entry.id}`, 'Link copied', 'Could not copy link');
  }

  async function handleDelete() {
    setDeleting(true);
    setToast({ message: 'Removing…', type: 'loading' });
    try {
      const res = await fetch(`/api/movies/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setToast({ message: 'Entry removed from vault', type: 'success' });
      setConfirming(false);
      setTimeout(() => router.push('/vault'), 1200);
    } catch {
      setToast({ message: 'Could not delete. Try again.', type: 'error' });
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="vdetail">
      <div
        className={`vdetail-ambient${ambientColor ? ' is-lit' : ''}`}
        style={{ '--glow-color': boostColor(ambientColor) } as React.CSSProperties}
        aria-hidden="true"
      />

      <DetailHero
        entry={entry}
        backHref={from}
        backLabel={from === '/vault' ? 'Back to vault' : 'Back'}
        actions={
          <DetailActions
            entry={entry}
            canStream={canStream}
            viewerEntry={viewerEntry}
            isOwner={isOwner}
            isSiteOwner={isSiteOwner}
            mustWatch={mustWatch}
            togglingMustWatch={togglingMustWatch}
            onToggleMustWatch={toggleMustWatch}
            onSaveToStack={() => setStackOpen(true)}
            onCopySummary={copySummary}
            onCopyLink={copyLink}
            onDelete={() => setConfirming(true)}
          />
        }
      />

      <div className="vdetail-body">
        <div className="vdetail-top">
          {movie.plot && <p className="vdetail-plot">{movie.plot}</p>}

          {entry.notes && (
            <figure className="vdetail-note">
              <blockquote className="vdetail-note-text">{entry.notes}</blockquote>
              <figcaption className="vdetail-note-label">Personal note</figcaption>
            </figure>
          )}

          <EntryTags
            entryId={entry.id}
            initialTags={entry.custom_tags ?? []}
            editable={isOwner}
            onError={message => setToast({ message, type: 'error' })}
          />
        </div>

        <DetailSidebar entry={entry} />

        <div className="vdetail-rest">
          <FranchiseTrack currentId={entry.id} currentTitle={title} entries={franchiseEntries} />
          <CastRow cast={movie.cast_list} />
          <SimilarRow entries={similar} />
        </div>
      </div>

      {isOwner && confirming && (
        <ConfirmDialog
          title="Remove entry?"
          body={`This permanently deletes your rating for "${title}". This cannot be undone.`}
          confirmLabel={deleting ? 'Removing…' : 'Remove'}
          onConfirm={handleDelete}
          onCancel={() => { if (!deleting) setConfirming(false); }}
        />
      )}

      {stackOpen && (
        <ListManagerModal
          movieId={movie.id}
          movieTitle={title}
          onClose={() => setStackOpen(false)}
          onNotify={(message, type) => setToast({ message, type })}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
          onUndo={toast.onUndo}
        />
      )}
    </div>
  );
}
