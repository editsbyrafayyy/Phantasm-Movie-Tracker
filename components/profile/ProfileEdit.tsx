'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/layout/AuthProvider';
import Toast, { type ToastType } from '@/components/ui/Toast';
import type { Profile } from '@/lib/types';

interface ProfileEditProps {
  profile: Profile;
}

export default function ProfileEdit({ profile }: ProfileEditProps) {
  const router = useRouter();
  const auth = useAuth();
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const next = displayName.trim();
    if (!next) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: next })
      .eq('id', profile.id);

    if (error) {
      setToast({ message: 'Could not update your name.', type: 'error' });
    } else {
      setToast({ message: 'Name updated.', type: 'success' });
      setEditing(false);
      await auth.refreshProfile?.();
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="profile-name-block">
      {editing ? (
        <form onSubmit={handleSave} className="profile-edit-form">
          <label htmlFor="display-name" className="form-label">Display name</label>
          <input
            id="display-name"
            type="text"
            className="field-input"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
            placeholder={profile.username}
            maxLength={40}
            disabled={saving}
            autoFocus
          />
          <div className="profile-edit-actions">
            <button type="submit" className="btn-primary" disabled={saving || !displayName.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-name-row">
          <h2 className="profile-display-name">{profile.display_name ?? profile.username}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={() => { setDisplayName(profile.display_name ?? ''); setEditing(true); }}
            aria-label="Edit display name"
          >
            <Pencil size={16} />
          </button>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
