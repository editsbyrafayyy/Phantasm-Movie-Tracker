'use client';

import { useState, useSyncExternalStore } from 'react';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export interface ToastLogItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'loading';
  timestamp: number;
}

// ── Module-level store (shared by every Toast on the page) ───────────────────
let toastHistory: ToastLogItem[] = [];
let totalLogged = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
const getHistory = () => toastHistory;
const getTotal = () => totalLogged;
const EMPTY: ToastLogItem[] = [];

export function logToastEvent(message: string, type: 'success' | 'error' | 'loading') {
  if (type === 'loading') return;
  totalLogged += 1;
  toastHistory = [
    { id: `${Date.now()}-${totalLogged}`, message, type, timestamp: Date.now() },
    ...toastHistory,
  ].slice(0, 20);
  listeners.forEach(l => l());
}

function timeAgo(ts: number, now: number) {
  const sec = Math.max(0, Math.floor((now - ts) / 1000));
  if (sec < 60) return sec < 5 ? 'just now' : `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

/** Navbar bell + dialog listing this session's toast notifications. */
export default function ToastHistoryModal() {
  const items = useSyncExternalStore(subscribe, getHistory, () => EMPTY);
  const total = useSyncExternalStore(subscribe, getTotal, () => 0);
  const [seenCount, setSeenCount] = useState(0);
  const [openedAt, setOpenedAt] = useState<number | null>(null);

  if (items.length === 0) return null;

  const hasUnread = total > seenCount;

  return (
    <>
      <button
        type="button"
        className={`icon-btn toast-history-btn${hasUnread ? ' has-unread' : ''}`}
        onClick={() => { setSeenCount(total); setOpenedAt(Date.now()); }}
        aria-label={hasUnread ? 'Notifications (new)' : 'Notifications'}
      >
        <Bell size={20} aria-hidden="true" />
      </button>

      {openedAt !== null && (
        <Modal onClose={() => setOpenedAt(null)} title="Notifications" size="sm" className="toast-history-modal">
          <ul className="toast-history-list">
            {items.map(item => (
              <li key={item.id} className="toast-history-item">
                {item.type === 'success'
                  ? <CheckCircle size={16} className="toast-history-icon is-success" aria-label="Success" />
                  : <AlertCircle size={16} className="toast-history-icon is-error" aria-label="Error" />}
                <div className="toast-history-text">
                  <p className="toast-history-message">{item.message}</p>
                  <span className="toast-history-time">{timeAgo(item.timestamp, openedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  );
}
