'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Pencil } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import AvatarPickerModal from '@/components/profile/AvatarPickerModal';
import Toast, { type ToastType } from '@/components/ui/Toast';
import type { Profile } from '@/lib/types';

interface ProfileAvatarProps {
  profile: Profile;
}

export default function ProfileAvatar({ profile }: ProfileAvatarProps) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const initial = (profile.display_name?.[0] ?? profile.username[0] ?? '?').toUpperCase();

  async function handleSaveAvatar(avatarUrl: string | null) {
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update avatar.');
      }

      setToast({ message: 'Avatar updated.', type: 'success' });
      await refreshProfile();
      router.refresh();
    } catch (err: unknown) {
      console.error('Error saving avatar:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save avatar.';
      setToast({ message: msg, type: 'error' });
      throw err;
    }
  }

  return (
    <>
      <div className="profile-avatar-wrap">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="profile-avatar-trigger-btn"
          aria-label="Change profile avatar"
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- small static SVG avatars
            <img src={profile.avatar_url} alt="" width={72} height={72} className="avatar-img-cover" />
          ) : (
            <span className="avatar-initial">{initial}</span>
          )}

          {/* Hover overlay hint */}
          <span className="profile-avatar-hover-overlay" aria-hidden="true">
            <Pencil size={16} />
          </span>
        </button>

        <span className="profile-avatar-badge" aria-hidden="true">
          <Camera size={14} />
        </span>
      </div>

      {modalOpen && (
        <AvatarPickerModal
          onClose={() => setModalOpen(false)}
          currentAvatar={profile.avatar_url}
          onSave={handleSaveAvatar}
          displayName={profile.display_name}
          username={profile.username}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </>
  );
}
