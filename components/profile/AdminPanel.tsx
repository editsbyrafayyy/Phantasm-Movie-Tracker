'use client';

import { useState, useEffect } from 'react';
import Toast from '@/components/ui/Toast';
import CustomSelect from '@/components/ui/CustomSelect';

type UserProfile = {
  id: string;
  username: string;
  display_name: string;
  role: string;
};

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
        if (data.length > 0) setSelectedUserId(data[0].id);
      } catch (err: any) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function handleAdminReset(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || newPassword.length < 6) {
      setToast({ message: 'Select a user and provide a password (min 6 chars).', type: 'error' });
      return;
    }

    setIsResetting(true);
    setToast(null);

    try {
      const res = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setToast({ message: 'User password reset successfully.', type: 'success' });
      setNewPassword('');
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsResetting(false);
    }
  }

  if (loading) {
    return <div style={{ marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>Loading admin panel...</div>;
  }

  const selectOptions = users.map(u => ({
    value: u.id,
    label: `@${u.username} ${u.display_name ? `(${u.display_name})` : ''} ${u.role === 'owner' ? '[Owner]' : ''}`
  }));

  return (
    <div className="form-section" style={{ width: '100%', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--red)' }}>Owner Actions</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        As the vault owner, you can reset passwords for other users.
      </p>
      
      <form onSubmit={handleAdminReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-field">
          <label className="form-label" htmlFor="user-select">Select User</label>
          <div style={{ position: 'relative', zIndex: 10 }}>
            {selectOptions.length > 0 && (
              <CustomSelect
                value={selectedUserId}
                options={selectOptions}
                onChange={(val) => setSelectedUserId(val)}
                ariaLabel="Select User"
              />
            )}
          </div>
        </div>
        
        <div className="form-field">
          <label className="form-label" htmlFor="admin-new-password">New Password</label>
          <input
            id="admin-new-password"
            type="password"
            className="form-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
            disabled={isResetting}
          />
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isResetting || !selectedUserId || newPassword.length < 6}
          style={{ alignSelf: 'flex-start' }}
        >
          {isResetting ? 'Resetting...' : 'Force Reset Password'}
        </button>
      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
