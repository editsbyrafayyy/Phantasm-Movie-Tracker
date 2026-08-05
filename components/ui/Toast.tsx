'use client';

import { useEffect, useState, useCallback } from 'react';
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

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 220);
  }, [onDismiss]);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));
    logToastEvent(message, type);

    if (type !== 'loading') {
      const t = setTimeout(dismiss, duration);
      return () => clearTimeout(t);
    }
  }, [type, message, duration, dismiss]);

  return (
    <div
      className={`toast toast-${type}${visible ? ' toast-visible' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-message">{message}</span>
      {onUndo && (
        <button
          className="toast-undo-btn"
          onClick={() => {
            onUndo();
            dismiss();
          }}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 12,
            padding: '3px 9px',
            borderRadius: 4,
            cursor: 'pointer',
            marginLeft: 12,
            marginRight: 6,
          }}
        >
          {undoLabel}
        </button>
      )}
      <button className="toast-dismiss" onClick={dismiss} aria-label="Dismiss notification">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
