'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Toast from '@/components/ui/Toast';

export default function PasswordReset() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setIsUpdating(true);
    setToast(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Password updated successfully.', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setIsUpdating(false);
  }

  return (
    <div className="form-section" style={{ width: '100%', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Change Password</h3>
      
      <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-field">
          <label className="form-label" htmlFor="new-password">New Password</label>
          <input
            id="new-password"
            type="password"
            className="form-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
            disabled={isUpdating}
          />
        </div>
        
        <div className="form-field">
          <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            disabled={isUpdating}
          />
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isUpdating || !newPassword || !confirmPassword}
          style={{ alignSelf: 'flex-start' }}
        >
          {isUpdating ? 'Updating...' : 'Update Password'}
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
