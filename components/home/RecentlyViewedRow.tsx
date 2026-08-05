'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, Clock } from 'lucide-react';

interface RecentlyViewedItem {
  id: string;
  title: string;
  poster_url: string | null;
  year: number | null;
  total: number | null;
  viewedAt: number;
}

export default function RecentlyViewedRow() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const storageKey = 'vault_recently_viewed';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  if (!items.length) return null;

  return (
    <div className="recently-viewed-section" style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Clock size={16} style={{ color: 'var(--text-muted)' }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Recently Viewed</h3>
      </div>

      <div
        className="recently-viewed-row"
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8,
          scrollbarWidth: 'none',
        }}
      >
        {items.map(item => (
          <Link
            key={item.id}
            href={`/vault/${item.id}`}
            style={{
              flexShrink: 0,
              width: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 100,
                height: 145,
                borderRadius: 8,
                overflow: 'hidden',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              {item.poster_url ? (
                <Image
                  src={item.poster_url}
                  alt={item.title}
                  fill
                  sizes="100px"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Film size={20} color="var(--text-dim)" />
                </div>
              )}
              {item.total !== null && item.total > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    background: 'rgba(0,0,0,0.85)',
                    color: 'var(--accent)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: 4,
                    border: '1px solid rgba(204, 0, 0, 0.4)',
                  }}
                >
                  {item.total}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
