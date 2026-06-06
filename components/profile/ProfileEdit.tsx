'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Toast, { type ToastType } from '@/components/ui/Toast';
import type { Profile } from '@/lib/types';

interface ProfileEditProps {
  profile: Profile;
}

export default function ProfileEdit({ profile }: ProfileEditProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', profile.id);

    if (error) {
      setToast({ message: 'Failed to update.', type: 'error' });
    } else {
      setToast({ message: 'Profile updated!', type: 'success' });
      setEditing(false);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="form-section" style={{ width: '100%' }}>
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
