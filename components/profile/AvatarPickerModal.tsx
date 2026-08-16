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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="avatar-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#121214',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 26px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <User size={18} color="var(--red)" />
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
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
              Curated CC0 collection from DiceBear Pixelbot &amp; Planets.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.65)',
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content body */}
        <div style={{ padding: '20px 26px', overflowY: 'auto', flex: 1 }}>
          {/* Active Preview Strip */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#141414',
                  border: '2px solid var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="Preview avatar"
                    width={52}
                    height={52}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      color: 'var(--text)',
                      fontWeight: 700,
                    }}
                  >
                    {initial}
                  </span>
                )}
              </div>

              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {displayName || username || 'Member'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.45)', margin: '2px 0 0' }}>
                  {selectedAvatar ? 'Custom avatar selected' : 'Default initial badge'}
                </p>
              </div>
            </div>

            {selectedAvatar !== null && (
              <button
                type="button"
                onClick={() => setSelectedAvatar(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 6,
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '5px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Collection Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: activeTab === 'all' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === 'all' ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              All (15)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pixelbot')}
              style={{
                background: activeTab === 'pixelbot' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: activeTab === 'pixelbot' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === 'pixelbot' ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s',
              }}
            >
              <Bot size={13} />
              Pixelbots (8)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('planets')}
              style={{
                background: activeTab === 'planets' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: activeTab === 'planets' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === 'planets' ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s',
              }}
            >
              <Globe size={13} />
              Planets (7)
            </button>
          </div>

          {/* Avatar Grid (5 columns desktop, 3 on mobile) */}
          <div
            className="avatar-selection-grid"
            role="radiogroup"
            aria-label="Choose an avatar option"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 10,
            }}
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
                  style={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    background: '#141414',
                    border: isSelected ? '2px solid var(--red)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 0.15s ease, transform 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
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
                    <div
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        background: 'var(--red)',
                        color: '#fff',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '14px 26px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            background: 'rgba(0, 0, 0, 0.15)',
          }}
        >
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
            }}
          >
            {saving ? 'Saving…' : 'Save Avatar'}
          </button>
        </div>
      </div>
    </div>
  );
}
