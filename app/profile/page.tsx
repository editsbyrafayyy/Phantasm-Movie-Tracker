'use client';

import { useState } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import Toast, { type ToastType } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';

export default function ProfilePage() {
  const { profile, loading } = useAuth();
  const [displayName, setDisplayName]   = useState('');
  const [editing,     setEditing]       = useState(false);
  const [saving,      setSaving]        = useState(false);
  const [toast,       setToast]         = useState<{ message: string; type: ToastType } | null>(null);

  if (loading) {
    return <div className="form-loading"><Spinner size={24} /> Loading…</div>;
  }

  if (!profile) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', profile!.id);

    if (error) {
      setToast({ message: 'Failed to update.', type: 'error' });
    } else {
      setToast({ message: 'Profile updated!', type: 'success' });
      setEditing(false);
    }
    setSaving(false);
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="page-container form-page">
      <header className="form-header">
        <p className="page-label">Your</p>
        <h1 className="page-title-serif">Profile.</h1>
      </header>

      <div className="profile-card">
        {/* Avatar */}
        <div className="profile-avatar" aria-hidden="true">
          {(profile.display_name?.[0] ?? profile.username[0]).toUpperCase()}
        </div>

        <div className="profile-info">
          <p className="profile-username">@{profile.username}</p>
          <p className="profile-meta">
            Member since {memberSince}
            {profile.role === 'owner' && <span className="profile-role-badge">Owner</span>}
          </p>
        </div>

        {/* Edit display name */}
        <div className="form-section">
          <p className="section-label">Display Name</p>
          {editing ? (
            <form onSubmit={handleSave} className="profile-edit-form">
              <input
                type="text"
                className="form-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={profile.display_name ?? profile.username}
                disabled={saving}
                autoFocus
              />
              <div className="profile-edit-actions">
                <button type="submit" className="btn-primary" disabled={saving || !displayName.trim()}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-display-name-row">
              <span className="profile-display-name">
                {profile.display_name ?? <span className="text-muted">Not set</span>}
              </span>
              <button
                className="btn-ghost profile-edit-btn"
                onClick={() => { setDisplayName(profile.display_name ?? ''); setEditing(true); }}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
