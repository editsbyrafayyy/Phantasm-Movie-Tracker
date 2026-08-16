'use client';

import { useState, useEffect } from 'react';
import { AVATAR_OPTIONS } from '@/lib/config';
import { X, Check, RotateCcw, User, Bot, Globe } from 'lucide-react';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  onSave: (avatarUrl: string | null) => Promise<void>;
  displayName?: string | null;
  username?: string;
}

export default function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  onSave,
  displayName,
  username,
}: AvatarPickerModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar);
  const [prevAvatar, setPrevAvatar] = useState<string | null>(currentAvatar);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pixelbot' | 'planets'>('all');

  if (currentAvatar !== prevAvatar) {
    setPrevAvatar(currentAvatar);
    setSelectedAvatar(currentAvatar);
  }

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initial = (displayName?.[0] ?? username?.[0] ?? 'V').toUpperCase();

  const pixelbots = AVATAR_OPTIONS.slice(0, 8);
  const planets = AVATAR_OPTIONS.slice(8, 15);

  const displayedAvatars =
    activeTab === 'pixelbot'
      ? pixelbots
      : activeTab === 'planets'
      ? planets
      : AVATAR_OPTIONS;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(selectedAvatar);
      onClose();
    } catch (err) {
      console.error('Failed to save avatar:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="avatar-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-picker-title"
    >
      <div
        className="avatar-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="avatar-modal-header">
          <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <User size={18} color="var(--red)" style={{ flexShrink: 0 }} />
              <h2
                id="avatar-picker-title"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Choose Your Avatar
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', margin: 0, lineHeight: 1.4 }}>
              Curated CC0 collection from DiceBear Pixelbot &amp; Planets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="avatar-modal-close-btn"
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content body */}
        <div className="avatar-modal-body">
          {/* Active Preview Strip */}
          <div className="avatar-preview-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              <div className="avatar-preview-circle">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="Preview avatar"
                    width={48}
                    height={48}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      color: 'var(--text)',
                      fontWeight: 700,
                    }}
                  >
                    {initial}
                  </span>
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    margin: 0,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayName || username || 'Member'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.45)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedAvatar ? 'Custom avatar selected' : 'Default initial badge'}
                </p>
              </div>
            </div>

            {selectedAvatar !== null && (
              <button
                type="button"
                onClick={() => setSelectedAvatar(null)}
                className="avatar-reset-btn"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Collection Filter Tabs */}
          <div className="avatar-modal-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`avatar-tab-btn${activeTab === 'all' ? ' active' : ''}`}
            >
              All (15)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pixelbot')}
              className={`avatar-tab-btn${activeTab === 'pixelbot' ? ' active' : ''}`}
            >
              <Bot size={13} />
              <span>Pixelbots (8)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('planets')}
              className={`avatar-tab-btn${activeTab === 'planets' ? ' active' : ''}`}
            >
              <Globe size={13} />
              <span>Planets (7)</span>
            </button>
          </div>

          {/* Avatar Grid */}
          <div
            className="avatar-selection-grid"
            role="radiogroup"
            aria-label="Choose an avatar option"
          >
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
                  aria-label={`Select avatar ${avatarNumber}`}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${avatarNumber}`}
                    width={68}
                    height={68}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: 6,
                    }}
                    loading="lazy"
                  />

                  {/* Selected checkmark indicator */}
                  {isSelected && (
                    <div className="avatar-grid-item-check">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="avatar-modal-footer">
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '7px 16px',
              fontSize: 13,
              borderRadius: 6,
              minHeight: 36,
              marginTop: 0,
              width: 'auto',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || selectedAvatar === currentAvatar}
            style={{
              padding: '7px 20px',
              fontSize: 13,
              borderRadius: 6,
              minHeight: 36,
              background: 'var(--red)',
              color: '#fff',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              width: 'auto',
            }}
          >
            {saving ? 'Saving…' : 'Save Avatar'}
          </button>
        </div>
      </div>
    </div>
  );
}
