'use client';

import { useState, useEffect } from 'react';
import { AVATAR_OPTIONS } from '@/lib/config';
import { X, Check, RotateCcw, Palette, Bot, Globe } from 'lucide-react';

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
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
          background: 'linear-gradient(180deg, #18181b 0%, #111113 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Palette size={18} color="#22d3ee" />
              <h2
                id="avatar-picker-title"
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Choose Your Avatar
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
              Curated CC0 collection from DiceBear Pixelbot &amp; Planets.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content body */}
        <div style={{ padding: '20px 28px', overflowY: 'auto', flex: 1 }}>
          {/* Active Preview Strip */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#141414',
                  border: '2px solid #22d3ee',
                  boxShadow: '0 0 16px rgba(34, 211, 238, 0.25)',
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
                    width={56}
                    height={56}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {initial}
                  </span>
                )}
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>
                  {displayName ?? username ?? 'Profile Preview'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 }}>
                  {selectedAvatar ? 'Custom Avatar Selected' : 'Initial Letter Default'}
                </div>
              </div>
            </div>

            {selectedAvatar !== null && (
              <button
                type="button"
                onClick={() => setSelectedAvatar(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.75)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <RotateCcw size={13} />
                <span>Reset to Initial</span>
              </button>
            )}
          </div>

          {/* Collection Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'all' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === 'all' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
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
                background: activeTab === 'pixelbot' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'pixelbot' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === 'pixelbot' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <Bot size={14} />
              Pixelbots (8)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('planets')}
              style={{
                background: activeTab === 'planets' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'planets' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === 'planets' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <Globe size={14} />
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
              gap: 12,
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
                    border: isSelected ? '2px solid #22d3ee' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 14,
                    padding: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected
                      ? '0 0 20px rgba(34, 211, 238, 0.35), inset 0 0 10px rgba(34, 211, 238, 0.15)'
                      : 'none',
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                  aria-label={`Select avatar ${avatarNumber}`}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${avatarNumber}`}
                    width={72}
                    height={72}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: 8,
                    }}
                    loading="lazy"
                  />

                  {/* Selected checkmark indicator */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        background: '#22d3ee',
                        color: '#000',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <Check size={12} strokeWidth={3.5} />
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
            padding: '16px 28px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              borderRadius: 8,
              minHeight: 38,
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
              padding: '8px 24px',
              fontSize: 13,
              borderRadius: 8,
              minHeight: 38,
              background: '#22d3ee',
              color: '#09090b',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 16px rgba(34, 211, 238, 0.3)',
            }}
          >
            {saving ? 'Saving…' : 'Save Avatar'}
          </button>
        </div>
      </div>
    </div>
  );
}
