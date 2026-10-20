'use client';

import { useState, Suspense, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

/** Only same-origin relative paths are allowed as post-login destinations. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  try {
    const url = new URL(raw, 'http://local.invalid');
    if (url.origin !== 'http://local.invalid') return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
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

    // Full page reload instead of client-side router.push — ensures the
    // newly-set auth cookie is actually sent with the next request.
    window.location.href = next;
  }

  return (
    <section className="login-page">
      <div className="login-container">
        {/* Headline */}
        <PageHeader
          eyebrow="Welcome back"
          title="Sign in"
          subtitle="Phantasm is invite-only. Use the account the owner set up for you."
          className="login-header"
        />

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
            <div className="password-field">
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
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-invite-note">
          No account? Ask the owner for an invite.
        </p>
      </div>
    </section>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-page" aria-busy="true" />}>
      <LoginForm />
    </Suspense>
  );
}