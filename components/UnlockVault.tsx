'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function UnlockVault({ isUnlocked }: { isUnlocked: boolean }) {
  const [passcode, setPasscode]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [isShaking, setIsShaking] = useState(false);

  if (isUnlocked) {
    return (
      <Link href="/add" className="hero-cta" id="cta-add-movie">
        Add a Movie →
      </Link>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      const data = await res.json();
      
      if (data.success) {
        // Refresh the page to trigger the server component to read the new cookie
        window.location.reload();
      } else {
        setError(data.error || 'Incorrect passcode.');
        setPasscode('');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch {
      setError('Network error.');
      setPasscode('');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`unlock-form${isShaking ? ' shake' : ''}`}
      style={{ animation: 'fadeUp 0.65s ease 0.52s forwards', opacity: 0 }}
    >
      <div className="unlock-input-wrap">
        <input
          type="password"
          value={passcode}
          onChange={e => setPasscode(e.target.value)}
          placeholder="Enter Vault Passcode"
          className="field-input unlock-input"
          disabled={loading}
        />
        <button type="submit" className="unlock-submit" disabled={loading || !passcode.trim()}>
          {loading ? '...' : 'Unlock'}
        </button>
      </div>
      {error && <p className="unlock-error">{error}</p>}
    </form>
  );
}
