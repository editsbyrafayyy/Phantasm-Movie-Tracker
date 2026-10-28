'use client';

import Link from 'next/link';
import { Copy, Layers, Link2, Pencil, Pin, Play, Plus, Trash2 } from 'lucide-react';
import type { Entry } from '@/lib/types';

interface DetailActionsProps {
  entry:             Entry;
  canStream:         boolean;
  viewerEntry:       { id: string; total: number | null } | null;
  isOwner:           boolean;
  isSiteOwner:       boolean;
  mustWatch:         boolean;
  togglingMustWatch: boolean;
  onToggleMustWatch: () => void;
  onSaveToStack:     () => void;
  onCopySummary:     () => void;
  onCopyLink:        () => void;
  onDelete:          () => void;
}

/** Primary (watch) + secondary actions for a vault entry. */
export default function DetailActions({
  entry, canStream, viewerEntry, isOwner, isSiteOwner, mustWatch, togglingMustWatch,
  onToggleMustWatch, onSaveToStack, onCopySummary, onCopyLink, onDelete,
}: DetailActionsProps) {
  const { movie } = entry;
  const title = movie.title ?? 'Unknown';
  const streamId = movie.omdb_id || movie.tmdb_id;
  const addHref = movie.omdb_id
    ? `/add?omdbId=${movie.omdb_id}&title=${encodeURIComponent(title)}`
    : movie.tmdb_id
      ? `/add?tmdbId=${movie.tmdb_id}&type=${movie.media_type ?? 'movie'}&title=${encodeURIComponent(title)}`
      : `/add?title=${encodeURIComponent(title)}`;

  return (
    <>
      {streamId && canStream && (
        <Link href={`/stream/${streamId}`} className="btn-primary vdetail-watch-btn">
          <Play size={16} fill="currentColor" aria-hidden="true" />
          Watch now
        </Link>
      )}

      {canStream && (
        <>
          {!isOwner && (viewerEntry ? (
            <Link href={`/vault/${viewerEntry.id}`} className="btn-secondary vdetail-your-score">
              Your score
              <strong>{(viewerEntry.total ?? 0) > 0 ? viewerEntry.total : '—'}</strong>
            </Link>
          ) : (
            <Link href={addHref} className="btn-secondary">
              <Plus size={16} aria-hidden="true" />
              Add to my vault
            </Link>
          ))}
          <button type="button" onClick={onSaveToStack} className="btn-secondary">
            <Layers size={16} aria-hidden="true" />
            Save to stack
          </button>
        </>
      )}

      {isSiteOwner && (
        <button
          type="button"
          onClick={onToggleMustWatch}
          disabled={togglingMustWatch}
          className={`btn-secondary${mustWatch ? ' is-active' : ''}`}
          aria-pressed={mustWatch}
        >
          <Pin size={16} fill={mustWatch ? 'currentColor' : 'none'} aria-hidden="true" />
          {mustWatch ? 'Must watch' : 'Mark must watch'}
        </button>
      )}

      {isOwner && (
        <Link href={`/update?id=${entry.id}`} className="btn-secondary">
          <Pencil size={16} aria-hidden="true" />
          Edit
        </Link>
      )}

      {canStream && (
        <span className="vdetail-icon-actions">
          <button type="button" onClick={onCopySummary} className="icon-btn" aria-label="Copy summary" data-tip="Copy summary">
            <Copy size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={onCopyLink} className="icon-btn" aria-label="Copy link" data-tip="Copy link">
            <Link2 size={16} aria-hidden="true" />
          </button>
          {isOwner && (
            <button type="button" onClick={onDelete} className="icon-btn vdetail-delete-btn" aria-label="Delete entry" data-tip="Delete entry">
              <Trash2 size={16} aria-hidden="true" />
            </button>
          )}
        </span>
      )}
    </>
  );
}
