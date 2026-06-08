'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Toast, { type ToastType } from '@/components/ui/Toast';
import { Pencil } from 'lucide-react';
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
    <div style={{ marginBottom: 4 }}>
      {editing ? (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            className="form-input"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={profile.display_name ?? profile.username}
            disabled={saving}
            autoFocus
            style={{ fontSize: 20, fontWeight: 600, padding: '8px 12px' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-primary" disabled={saving || !displayName.trim()} style={{ minHeight: 32, padding: '6px 16px', fontSize: 13, width: 'auto' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)} style={{ minHeight: 32, padding: '6px 12px', fontSize: 13, width: 'auto', marginTop: 0 }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text)', lineHeight: 1.2 }}>
            {profile.display_name ?? profile.username}
          </h2>
          <button
            onClick={() => { setDisplayName(profile.display_name ?? ''); setEditing(true); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              borderRadius: 4,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--text)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'none';
            }}
            aria-label="Edit display name"
          >
            <Pencil size={14} />
          </button>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
