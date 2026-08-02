'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Trash2 } from 'lucide-react';

interface HistoryEntry {
  id:         string;
  title:      string;
  poster_url: string | null;
  type:       string;
  watchedAt:  number;
}

const HISTORY_KEY = 'vault_watch_history';
const TTL_MS      = 30 * 24 * 60 * 60 * 1000;

export default function WatchHistoryRow() {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const all: HistoryEntry[] = JSON.parse(raw);
      const now = Date.now();
      // Filter stale and keep order (most recent first)
      const fresh = all.filter(e => (now - e.watchedAt) < TTL_MS);
      setItems(fresh);
    } catch { /* ignore */ }
  }, []);

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    setItems([]);
  }

  if (items.length === 0) return null;

  return (
    <section className="watch-history-section">
      <div className="watch-history-header">
        <span className="watch-history-label">Pick Up Where You Left Off</span>
        <button className="watch-history-clear" onClick={clearHistory} aria-label="Clear watch history">
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      <div className="watch-history-row">
        {items.map(item => (
          <Link
            key={item.id}
            href={`/stream/${item.id}`}
            className="watch-history-card"
            prefetch={false}
          >
            <div className="watch-history-poster">
              {item.poster_url ? (
                <Image
                  src={`/_next/image?url=${encodeURIComponent(item.poster_url)}&w=200&q=70`}
                  alt={item.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="120px"
                  unoptimized
                />
              ) : (
                <div className="watch-history-poster-fallback">
                  {item.title.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="watch-history-play-overlay">
                <Play size={18} fill="white" color="white" />
              </div>
            </div>
            <p className="watch-history-title">{item.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
