'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export interface ToastLogItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'loading';
  timestamp: number;
}

// Global in-memory log — module-level singleton
const toastHistory: ToastLogItem[] = [];

export function logToastEvent(message: string, type: 'success' | 'error' | 'loading') {
  if (type === 'loading') return;
  toastHistory.unshift({
    id: Math.random().toString(36).slice(2, 9),
    message,
    type,
    timestamp: Date.now(),
  });
  if (toastHistory.length > 20) toastHistory.pop();
}

export default function ToastHistoryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<ToastLogItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  // Track when new toasts arrive so the indicator lights up
  useEffect(() => {
    const interval = setInterval(() => {
      if (toastHistory.length > 0) {
        setHasUnread(true);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const open = useCallback(() => {
    setItems([...toastHistory]);
    setHasUnread(false);
    setIsOpen(true);
  }, []);

  function timeFormatted(ts: number) {
    const secAgo = Math.floor((Date.now() - ts) / 1000);
    if (secAgo < 60) return `${secAgo}s ago`;
    const minAgo = Math.floor(secAgo / 60);
    return `${minAgo}m ago`;
  }

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <>
      {/* Bell trigger — only shows when there IS history */}
      {toastHistory.length > 0 && (
        <button
          onClick={open}
          title="Notification history"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            borderRadius: 8,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          {/* Simple dot indicator — no generic bell icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2a4.5 4.5 0 0 1 4.5 4.5c0 2.5.75 3.75 1.5 4.5H2c.75-.75 1.5-2 1.5-4.5A4.5 4.5 0 0 1 8 2z" />
            <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" />
          </svg>
          {hasUnread && (
            <span style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--red)',
            }} />
          )}
        </button>
      )}

      {/* Backdrop + Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9990 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: 58,
                right: 20,
                zIndex: 9999,
                width: 320,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text)' }}>
                  Recent Activity
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 4 }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {items.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No recent notifications.
                  </div>
                ) : (
                  items.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {item.type === 'success'
                        ? <CheckCircle size={14} style={{ color: '#4a7c3f', flexShrink: 0, marginTop: 2 }} />
                        : <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.4, wordBreak: 'break-word' }}>{item.message}</p>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 3 }}>
                          {timeFormatted(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
