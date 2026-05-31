'use client';

import { useEffect, useState } from 'react';

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
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
    </div>
  );
}
