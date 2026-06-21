'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface WatchlistRemoveButtonProps {
  tmdbId:    number;
  mediaType: string;
}

export default function WatchlistRemoveButton({ tmdbId, mediaType }: WatchlistRemoveButtonProps) {
  const router   = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await fetch(`/api/watchlist?tmdb_id=${tmdbId}&media_type=${mediaType}`, {
        method: 'DELETE',
      });
      router.refresh(); // Revalidates the server component
    } catch { /* silently fail */ }
    finally { setBusy(false); }
  }

  return (
    <button
      className="watchlist-remove-btn"
      onClick={remove}
      disabled={busy}
      aria-label="Remove from watchlist"
      title="Remove from Watch Later"
    >
      <X size={14} />
    </button>
  );
}
