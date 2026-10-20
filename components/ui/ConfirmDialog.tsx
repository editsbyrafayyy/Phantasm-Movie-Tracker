'use client';

import Modal from '@/components/ui/Modal';

interface ConfirmDialogProps {
  title:     string;
  body:      string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel:  () => void;
}

/** Destructive confirmation. Mount conditionally; Cancel gets initial focus. */
export default function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} size="sm" className="confirm-dialog">
      <p className="dialog-body">{body}</p>
      <div className="dialog-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} data-autofocus>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
