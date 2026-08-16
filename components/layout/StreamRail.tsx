'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown } from 'lucide-react';
import ToastHistoryModal from '@/components/ui/ToastHistoryModal';
import { useAuth } from '@/components/layout/AuthProvider';

export default function StreamRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function isActive(path: string) {
    if (path === '/') {
      return pathname === '/' ? ' active' : '';
    }
    return pathname.startsWith(path) ? ' active' : '';
  }

  const initial = profile?.display_name?.[0] ?? profile?.username?.[0] ?? user?.email?.[0] ?? '?';
  const displayName = profile?.display_name ?? profile?.username ?? user?.email ?? '';

  // Global 'N' shortcut → navigate to /add (auth-gated, skips input/textarea focus)
  useEffect(() => {
    if (!user) return;
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        router.push('/add');
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [user, router]);

  return (
    <header className="unified-top-navbar" aria-label="Main navigation">
      <div className="navbar-container unified-navbar-container">
        {/* Left group: Logo + Links */}
        <div className="navbar-left-group">
          {/* Logo */}
          <Link href="/" className="navbar-logo" prefetch={true}>
            <img 
              src="/apple-touch-icon.png?v=2" 
              alt="Movie Tracker Logo" 
              width={26} 
              height={26} 
              className="navbar-logo-icon-img" 
              style={{ borderRadius: '4px', objectFit: 'cover' }}
            />
            <span className="navbar-logo-text">PHANTASM</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="navbar-links-desktop" aria-label="Desktop navigation">
            <Link href="/" className={`navbar-link${isActive('/')}`} prefetch={true}>
              Rafay&apos;s Movies
            </Link>
            {user && (
              <>
                <Link href="/stream" className={`navbar-link${isActive('/stream')}`} prefetch={true}>
                  Stream
                </Link>
                <Link href="/vault" className={`navbar-link${isActive('/vault')}`} prefetch={true}>
                  Your Vault
                </Link>
                <Link href="/diary" className={`navbar-link${isActive('/diary')}`} prefetch={true}>
                  Diary
                </Link>
                <Link href="/add" className={`navbar-link${isActive('/add')}`} prefetch={true}>
                  Log Film
                </Link>
                <Link href="/watchlist" className={`navbar-link${isActive('/watchlist')}`} prefetch={true}>
                  Watch Later
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right side: Auth area & Notification History */}
        <div className="navbar-auth-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ToastHistoryModal />
          {loading ? (
            <div className="navbar-auth-loading" aria-hidden="true" />
          ) : user ? (
            <div className="navbar-profile-dropdown-container">
              <button
                className="navbar-profile-btn"
                onClick={() => setDropdownOpen(o => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <span className="navbar-profile-avatar" aria-hidden="true" style={{ overflow: 'hidden', padding: 0 }}>
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      width={28}
                      height={28}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    initial.toUpperCase()
                  )}
                </span>
                <span className="navbar-profile-username">{displayName}</span>
                <ChevronDown size={14} className={`navbar-profile-chevron${dropdownOpen ? ' open' : ''}`} aria-hidden="true" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="navbar-dropdown-backdrop"
                    onClick={() => setDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="navbar-dropdown" role="menu">
                    <Link
                      href="/profile"
                      className="navbar-dropdown-item"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                      prefetch={true}
                    >
                      <User size={14} aria-hidden="true" />
                      Profile
                    </Link>
                    <button
                      className="navbar-dropdown-item navbar-dropdown-signout"
                      role="menuitem"
                      onClick={async () => {
                        setDropdownOpen(false);
                        await signOut();
                        router.push('/login');
                        router.refresh();
                      }}
                    >
                      <LogOut size={14} aria-hidden="true" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="navbar-guest-label">Guest</span>
              <Link href="/login" className="navbar-signin-btn" prefetch={true}>
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
