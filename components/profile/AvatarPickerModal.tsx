'use client';

import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { AVATAR_OPTIONS } from '@/lib/config';

interface AvatarPickerModalProps {
  onClose: () => void;
  currentAvatar: string | null;
  onSave: (avatarUrl: string | null) => Promise<void>;
  displayName?: string | null;
  username?: string;
}

type Tab = 'all' | 'pixelbot' | 'planets';

const PIXELBOTS = AVATAR_OPTIONS.slice(0, 8);
const PLANETS   = AVATAR_OPTIONS.slice(8, 15);

const TABS: { key: Tab; label: string; items: readonly string[] }[] = [
  { key: 'all',      label: 'All',       items: AVATAR_OPTIONS },
  { key: 'pixelbot', label: 'Pixelbots', items: PIXELBOTS },
  { key: 'planets',  label: 'Planets',   items: PLANETS },
];

/** Mount conditionally — selection starts from the current avatar each time. */
export default function AvatarPickerModal({
  onClose,
  currentAvatar,
  onSave,
  displayName,
  username,
}: AvatarPickerModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const initial = (displayName?.[0] ?? username?.[0] ?? 'V').toUpperCase();
  const displayedAvatars = TABS.find(t => t.key === activeTab)?.items ?? AVATAR_OPTIONS;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(selectedAvatar);
      onClose();
    } catch {
      // The parent shows the error toast; keep the picker open so the user can retry.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Choose avatar" size="md" className="avatar-modal" onClose={onClose}>
      <div className="avatar-preview-strip">
        <div className="avatar-preview-main">
          <div className="avatar-preview-circle">
            {selectedAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- small static SVG avatars
              <img src={selectedAvatar} alt="" width={48} height={48} className="avatar-img-cover" />
            ) : (
              <span className="avatar-initial avatar-initial-sm">{initial}</span>
            )}
          </div>
          <div className="avatar-preview-text">
            <p className="avatar-preview-name">{displayName || username || 'Member'}</p>
            <p className="avatar-preview-sub">{selectedAvatar ? 'Avatar selected' : 'Initial badge'}</p>
          </div>
        </div>

        {selectedAvatar !== null && (
          <button type="button" onClick={() => setSelectedAvatar(null)} className="btn-ghost avatar-reset-btn">
            <RotateCcw size={14} aria-hidden="true" />
            Use initial
          </button>
        )}
      </div>

      <div className="avatar-modal-tabs" role="group" aria-label="Avatar collection">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            className="chip"
            aria-pressed={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label} ({t.items.length})
          </button>
        ))}
      </div>

      <div className="avatar-selection-grid" role="radiogroup" aria-label="Avatars">
        {displayedAvatars.map((avatar, idx) => {
          const isSelected = selectedAvatar === avatar;
          const avatarNumber = avatar.match(/avatar-(\d+)/)?.[1] ?? `${idx + 1}`;
          return (
            <button
              key={avatar}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedAvatar(avatar)}
              className={`avatar-grid-item${isSelected ? ' selected' : ''}`}
              aria-label={`Avatar ${avatarNumber}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG avatars */}
              <img src={avatar} alt="" width={68} height={68} className="avatar-grid-img" loading="lazy" />
              {isSelected && (
                <span className="avatar-grid-item-check" aria-hidden="true">
                  <Check size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="avatar-modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary avatar-save-btn"
          onClick={handleSave}
          disabled={saving || selectedAvatar === currentAvatar}
        >
          {saving ? 'Saving…' : 'Save avatar'}
        </button>
      </div>
    </Modal>
  );
}
