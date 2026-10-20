'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Toast from '@/components/ui/Toast';

export default function PasswordReset() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setIsUpdating(true);
    setToast(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Password updated.', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsUpdating(false);
  }

  return (
    <section className="settings-block" aria-labelledby="password-heading">
      <h3 id="password-heading" className="settings-title">Change password</h3>

      <form onSubmit={handleResetPassword} className="settings-form">
        <div className="form-field">
          <label className="form-label" htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            className="field-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            minLength={6}
            required
            disabled={isUpdating}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            className="field-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat the new password"
            autoComplete="new-password"
            required
            disabled={isUpdating}
            aria-invalid={mismatch || undefined}
            aria-describedby={mismatch ? 'confirm-password-error' : undefined}
          />
          {mismatch && <p id="confirm-password-error" className="field-error">Passwords do not match.</p>}
        </div>

        <button
          type="submit"
          className="btn-secondary settings-action"
          disabled={isUpdating || !newPassword || !confirmPassword || mismatch}
        >
          {isUpdating ? 'Updating…' : 'Update password'}
        </button>
      </form>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </section>
  );
}
