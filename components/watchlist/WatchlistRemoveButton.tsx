'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface WatchlistRemoveButtonProps {
  tmdbId:    number;
  mediaType: string;
  title?:    string;
  onRemove?: () => void;
}

export default function WatchlistRemoveButton({ tmdbId, mediaType, title, onRemove }: WatchlistRemoveButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/watchlist?tmdb_id=${tmdbId}&media_type=${mediaType}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRemove?.();
      }
    } catch { /* silently fail */ }
    finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <button
        className="watchlist-remove-btn"
        onClick={() => setConfirming(true)}
        disabled={busy}
        aria-label="Remove from Watch Later"
        title="Remove from Watch Later"
      >
        <Trash2 size={14} />
      </button>

      {confirming && (
        <ConfirmDialog
          title="Remove from Watch Later?"
          body={title ? `"${title}" will be removed from your Watch Later list.` : 'This title will be removed from your Watch Later list.'}
          confirmLabel="Remove"
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
