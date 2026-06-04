'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'loading';

interface ToastProps {
  message:  string;
  type:     ToastType;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({ message, type, onDismiss, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 220);
  }, [onDismiss]);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));

    if (type !== 'loading') {
      const t = setTimeout(dismiss, duration);
      return () => clearTimeout(t);
    }
  }, [type, duration, dismiss]);

  return (
    <div
      className={`toast toast-${type}${visible ? ' toast-visible' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-message">{message}</span>
      <button className="toast-dismiss" onClick={dismiss} aria-label="Dismiss notification">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
