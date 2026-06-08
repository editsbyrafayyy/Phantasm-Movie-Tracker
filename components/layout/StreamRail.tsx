'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';

export default function StreamRail() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function isActive(path: string) {
    if (path === '/') {
      return pathname === '/' ? ' active' : '';
    }
    return pathname.startsWith(path) ? ' active' : '';
  }

  const initial = profile?.display_name?.[0] ?? profile?.username?.[0] ?? user?.email?.[0] ?? '?';
  const displayName = profile?.display_name ?? profile?.username ?? user?.email ?? '';

  return (
    <header className="unified-top-navbar" aria-label="Main navigation">
      <div className="navbar-container unified-navbar-container">
        {/* Left group: Logo + Links */}
        <div className="navbar-left-group">
          {/* Logo */}
          <Link href="/" className="navbar-logo" prefetch={true}>
            <Moon size={18} className="navbar-logo-icon" />
            <span className="navbar-logo-text">VAULT</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="navbar-links-desktop" aria-label="Desktop navigation">
            <Link href="/" className={`navbar-link${isActive('/')}`} prefetch={true}>
              Rafay's Movies
            </Link>
            {user && (
              <>
                <Link href="/browse" className={`navbar-link${isActive('/browse')}`} prefetch={true}>
                  Browse
                </Link>
                <Link href="/stream" className={`navbar-link${isActive('/stream')}`} prefetch={true}>
                  Stream
                </Link>
                <Link href="/vault" className={`navbar-link${isActive('/vault')}`} prefetch={true}>
                  Your Vault
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right side: Auth area */}
        <div className="navbar-auth-desktop">
          {user ? (
            <div className="navbar-profile-dropdown-container">
              <button
                className="navbar-profile-btn"
                onClick={() => setDropdownOpen(o => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <span className="navbar-profile-avatar" aria-hidden="true">
                  {initial.toUpperCase()}
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
                      onClick={() => { setDropdownOpen(false); signOut(); }}
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
