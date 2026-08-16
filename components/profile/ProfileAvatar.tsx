'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Pencil } from 'lucide-react';
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update avatar.');
      }

      setToast({ message: 'Avatar updated successfully!', type: 'success' });
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
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="profile-avatar-trigger-btn"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#141414',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
            padding: 0,
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#22d3ee';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 211, 238, 0.35)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
          }}
          aria-label="Change profile avatar"
          title="Click to choose a new avatar"
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${profile.display_name ?? profile.username}'s avatar`}
              width={72}
              height={72}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 30,
                color: 'var(--text)',
                fontWeight: 700,
              }}
            >
              {initial}
            </span>
          )}

          {/* Hover overlay hint */}
          <div
            className="profile-avatar-hover-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.15s ease',
            }}
          >
            <Pencil size={18} color="#fff" />
          </div>
        </button>

        {/* Small badge button on bottom right */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            background: '#22d3ee',
            color: '#000',
            border: '2px solid #18181b',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
            transition: 'transform 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Change avatar"
          title="Change avatar"
        >
          <Sparkles size={12} strokeWidth={2.5} />
        </button>
      </div>

      <AvatarPickerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentAvatar={profile.avatar_url}
        onSave={handleSaveAvatar}
        displayName={profile.display_name}
        username={profile.username}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </>
  );
}
