'use client';

import Link               from 'next/link';
import { usePathname }    from 'next/navigation';
import { useState }       from 'react';
import { Moon, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth }        from '@/components/layout/AuthProvider';

const NAV_LINKS = [
  { label: 'Home',      href: '/',       auth: false },
  { label: 'Vault',     href: '/vault',  auth: true  },
  { label: 'Add Movie', href: '/add',    auth: true  },
  { label: 'Stats',     href: '/stats',  auth: true  },
];

export default function Navbar() {
  const pathname              = usePathname();
  const { user, profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAuthenticated = !!user;
  const visibleLinks    = NAV_LINKS.filter(l => !l.auth || isAuthenticated);

  const initial = profile?.display_name?.[0] ?? profile?.username?.[0] ?? user?.email?.[0] ?? '?';
  const displayName = profile?.display_name ?? profile?.username ?? user?.email ?? '';

  return (
    <nav className="navbar-pill" aria-label="Main navigation">
      {/* Logo */}
      <Link href="/" className="navbar-pill-logo">
        <Moon className="navbar-pill-logo-icon" aria-hidden="true" size={16} strokeWidth={2.5} />
        <span>VAULT</span>
      </Link>

      {/* Divider */}
      <div className="navbar-pill-divider" aria-hidden="true" />

      {/* Nav links */}
      <div className="navbar-pill-links">
        {visibleLinks.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`navbar-pill-link${pathname === href ? ' active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Auth chip — only when logged in */}
      {isAuthenticated && (
        <div className="navbar-auth-chip">
          <button
            className="navbar-avatar-btn"
            onClick={() => setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <span className="navbar-avatar" aria-hidden="true">
              {initial.toUpperCase()}
            </span>
            <span className="navbar-username">{displayName}</span>
            <ChevronDown size={12} className={`navbar-chevron${dropdownOpen ? ' open' : ''}`} aria-hidden="true" />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
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
      )}

      {/* Sign in link — only when logged out */}
      {!isAuthenticated && (
        <Link href="/login" className="navbar-pill-link">
          Sign In
        </Link>
      )}
    </nav>
  );
}
