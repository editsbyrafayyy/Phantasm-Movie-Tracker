'use client';

import { useState, useEffect } from 'react';
import Toast from '@/components/ui/Toast';

type UserProfile = {
  id: string;
  username: string;
  display_name: string | null;
  role: string;
};

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isRefreshingMoods, setIsRefreshingMoods] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/users', { signal: controller.signal })
      .then(async res => {
        if (!res.ok) throw new Error('Failed to load users');
        const data: unknown = await res.json();
        const list = Array.isArray(data) ? (data as UserProfile[]) : [];
        setUsers(list);
        if (list.length > 0) setSelectedUserId(list[0].id);
        setLoadState('ready');
      })
      .catch(err => {
        if ((err as Error)?.name !== 'AbortError') setLoadState('error');
      });
    return () => controller.abort();
  }, []);

  async function handleRefreshMoods() {
    setIsRefreshingMoods(true);
    setToast(null);
    try {
      const res = await fetch('/api/stream/moods/refresh', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to refresh recommendations');
      setToast({ message: 'Mood recommendations refreshed.', type: 'success' });
    } catch (err) {
      setToast({ message: errorMessage(err, 'Failed to refresh recommendations'), type: 'error' });
    } finally {
      setIsRefreshingMoods(false);
    }
  }

  async function handleAdminReset(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || newPassword.length < 6) {
      setToast({ message: 'Select a user and enter a password of at least 6 characters.', type: 'error' });
      return;
    }

    setIsResetting(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setToast({ message: 'Password reset.', type: 'success' });
      setNewPassword('');
    } catch (err) {
      setToast({ message: errorMessage(err, 'Failed to reset password'), type: 'error' });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <section className="settings-block admin-panel" aria-labelledby="admin-heading">
      <h3 id="admin-heading" className="settings-title">Owner actions</h3>

      {loadState === 'loading' && <p className="settings-desc">Loading members…</p>}
      {loadState === 'error' && (
        <p className="field-error" role="alert">Could not load the member list. Reload the page to try again.</p>
      )}

      {loadState === 'ready' && (
        <form onSubmit={handleAdminReset} className="settings-form">
          <p className="settings-desc">Reset the password for another member.</p>
          <div className="form-field">
            <label className="form-label" htmlFor="admin-user">Member</label>
            <select
              id="admin-user"
              className="field-input field-select"
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              disabled={isResetting || users.length === 0}
            >
              {users.length === 0 && <option value="">No members</option>}
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  @{u.username}{u.display_name ? ` (${u.display_name})` : ''}{u.role === 'owner' ? ' — owner' : ''}
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
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              minLength={6}
              required
              disabled={isResetting}
            />
          </div>

          <button
            type="submit"
            className="btn-secondary settings-action"
            disabled={isResetting || !selectedUserId || newPassword.length < 6}
          >
            {isResetting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      )}

      <div className="settings-subblock">
        <h4 className="settings-subtitle">Mood recommendations</h4>
        <p className="settings-desc">
          Rebuild the cached &ldquo;Pick by mood&rdquo; pools from your vault and TMDB.
        </p>
        <button
          type="button"
          onClick={handleRefreshMoods}
          className="btn-secondary settings-action"
          disabled={isRefreshingMoods}
        >
          {isRefreshingMoods ? 'Refreshing…' : 'Refresh mood pools'}
        </button>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </section>
  );
}
