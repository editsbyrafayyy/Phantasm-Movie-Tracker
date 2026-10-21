'use client';

import { useState } from 'react';
import Toast from '@/components/ui/Toast';

interface Member {
  id:           string;
  username:     string;
  display_name: string | null;
}

/** Set a new password for another member (owner only; enforced by the API route). */
export default function ResetPasswordForm({ members }: { members: Member[] }) {
  const [userId, setUserId] = useState(members[0]?.id ?? '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || password.length < 6) return;
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setToast({ message: 'Password reset.', type: 'success' });
      setPassword('');
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to reset password', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (!members.length) {
    return <p className="settings-desc">No other members yet.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <div className="form-field">
        <label className="form-label" htmlFor="admin-user">Member</label>
        <select
          id="admin-user"
          className="field-input field-select"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          disabled={saving}
        >
          {members.map(m => (
            <option key={m.id} value={m.id}>
              @{m.username}{m.display_name ? ` (${m.display_name})` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="admin-new-password">New password</label>
        <input
          id="admin-new-password"
          type="password"
          className="field-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          minLength={6}
          required
          disabled={saving}
        />
      </div>
      <button type="submit" className="btn-secondary settings-action" disabled={saving || password.length < 6}>
        {saving ? 'Resetting…' : 'Reset password'}
      </button>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </form>
  );
}
