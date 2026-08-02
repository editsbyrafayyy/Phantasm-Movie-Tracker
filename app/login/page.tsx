'use client';

import { useState, Suspense, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Moon, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router       = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    // Read straight from the DOM instead of trusting React state to have
    // caught up. Safari's iCloud Keychain autofill can fill the visible
    // input value without firing a proper onChange/input event, which
    // leaves React state out of sync with what's on screen (Mac-specific
    // bug: submit button stays disabled, native :invalid styling kicks in).
    const form = e.currentTarget;
    const emailVal = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const passwordVal = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (!emailVal || !passwordVal) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: emailVal, password: passwordVal });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Always redirect to Rafay's Movies Page (home)
    router.push('/');
    router.refresh();
  }

  return (
    <section className="login-page">
      <div className="login-container">
        {/* Headline */}
        <header className="login-header">
          <p className="page-label">Welcome back</p>
          <h1 className="page-title-serif">Sign in.</h1>
          <p className="login-sub">This is a private vault. Accounts are by invitation only.</p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-field">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="login-error" role="alert">{error}</p>
          )}

          {/* Only disable while a request is in flight. Gating on
              !email || !password caused false negatives on Mac Safari
              when autofill filled the fields without updating React
              state, leaving the button permanently disabled. Real
              emptiness is now checked inside handleSubmit instead. */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="login-invite-note">
          Don&apos;t have an account? Ask the vault owner for an invite.
        </p>
      </div>
    </section>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="form-loading">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}