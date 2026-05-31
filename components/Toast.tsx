'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message:   string;
  type:      ToastType;
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="alert"
      className={`toast toast-${type}${exiting ? ' toast-exit' : ''}`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="toast-icon" size={18} />
      ) : (
        <XCircle className="toast-icon" size={18} />
      )}
      <span>{message}</span>
    </div>
  );
}
