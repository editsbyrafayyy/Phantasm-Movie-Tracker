'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export interface ToastLogItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'loading';
  timestamp: number;
}

// Global in-memory log
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

  useEffect(() => {
    if (isOpen) {
      setItems([...toastHistory]);
    }
  }, [isOpen]);

  function timeFormatted(ts: number) {
    const secAgo = Math.floor((Date.now() - ts) / 1000);
    if (secAgo < 60) return `${secAgo}s ago`;
    const minAgo = Math.floor(secAgo / 60);
    return `${minAgo}m ago`;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
        title="View notification history"
      >
        <Bell size={16} />
        {toastHistory.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--red)',
            }}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="toast-history-dropdown"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'fixed',
              top: 60,
              right: 20,
              zIndex: 9999,
              width: 320,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text)' }}>
                Notification History
              </span>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ maxHeight: 280, overflowY: 'auto', padding: '8px 12px' }}>
              {items.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
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
                      padding: '10px 8px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {item.type === 'success' ? (
                      <CheckCircle size={15} style={{ color: '#4a7c3f', flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <AlertCircle size={15} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{item.message}</p>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                        {timeFormatted(item.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
