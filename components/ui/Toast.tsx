'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { logToastEvent } from '@/components/ui/ToastHistoryModal';

export type ToastType = 'success' | 'error' | 'loading';

interface ToastProps {
  message:   string;
  type:      ToastType;
  onDismiss: () => void;
  onUndo?:   () => void;
  undoLabel?: string;
  duration?: number;
}

export default function Toast({ message, type, onDismiss, onUndo, undoLabel = 'Undo', duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  // Parents usually pass an inline onDismiss; keep the latest in a ref so a
  // parent re-render doesn't restart the auto-dismiss timer.
  const onDismissRef = useRef(onDismiss);
  const loggedRef = useRef<string | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  const dismiss = () => {
    setVisible(false);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => onDismissRef.current(), 220);
  };
  const dismissRef = useRef(dismiss);
  useEffect(() => { dismissRef.current = dismiss; });

  // Log each distinct message once (survives re-renders and Strict Mode re-runs).
  useEffect(() => {
    const key = `${type}:${message}`;
    if (loggedRef.current === key) return;
    loggedRef.current = key;
    logToastEvent(message, type);
  }, [type, message]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    if (type === 'loading') return () => cancelAnimationFrame(raf);
    const t = setTimeout(() => dismissRef.current(), duration);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [type, message, duration]);

  useEffect(() => () => { if (exitTimerRef.current) clearTimeout(exitTimerRef.current); }, []);

  return (
    <div
      className={`toast toast-${type}${visible ? ' toast-visible' : ''}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="toast-message">{message}</span>
      {onUndo && (
        <button
          type="button"
          className="toast-undo-btn"
          onClick={() => {
            onUndo();
            dismiss();
          }}
        >
          {undoLabel}
        </button>
      )}
      <button type="button" className="toast-dismiss" onClick={dismiss} aria-label="Dismiss notification">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
