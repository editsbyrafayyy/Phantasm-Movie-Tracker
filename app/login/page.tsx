'use client';

import { useState, Suspense, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Moon } from 'lucide-react';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get('next') ?? '/vault';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <section className="login-page">
      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <Moon size={20} strokeWidth={2} className="login-logo-icon" aria-hidden="true" />
          <span className="login-logo-text">VAULT</span>
        </div>

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
              type="email"
              autoComplete="email"
              required
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <p className="login-error" role="alert">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !email || !password}
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
