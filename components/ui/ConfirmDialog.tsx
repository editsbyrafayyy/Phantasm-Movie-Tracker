'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  title:     string;
  body:      string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel:  () => void;
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open for safety (harder to accidentally confirm)
  useEffect(() => { cancelRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog-backdrop" onClick={onCancel} aria-hidden="true" />
      <div className="dialog-panel">
        <h2 id="dialog-title" className="dialog-title">{title}</h2>
        <p className="dialog-body">{body}</p>
        <div className="dialog-actions">
          <button ref={cancelRef} className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
