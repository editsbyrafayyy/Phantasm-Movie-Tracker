'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast from '@/components/ui/Toast';
import { invalidateWatchlistCache } from '@/components/watchlist/WatchlistButton';

interface WatchlistRemoveButtonProps {
  tmdbId:    number;
  mediaType: string;
  title?:    string;
  onRemove?: () => void;
}

export default function WatchlistRemoveButton({ tmdbId, mediaType, title, onRemove }: WatchlistRemoveButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/watchlist?tmdb_id=${tmdbId}&media_type=${encodeURIComponent(mediaType)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error(String(res.status));
      invalidateWatchlistCache();
      onRemove?.();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="icon-btn watchlist-remove-btn"
        onClick={() => setConfirming(true)}
        disabled={busy}
        aria-label={title ? `Remove ${title} from Watch later` : 'Remove from Watch later'}
      >
        <Trash2 size={16} />
      </button>

      {confirming && (
        <ConfirmDialog
          title="Remove from Watch later?"
          body={title ? `"${title}" will be removed from your list.` : 'This title will be removed from your list.'}
          confirmLabel="Remove"
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      )}

      {failed && (
        <Toast message="Could not remove that title. Try again." type="error" onDismiss={() => setFailed(false)} />
      )}
    </>
  );
}
