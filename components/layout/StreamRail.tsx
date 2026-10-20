'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, BookOpen, Compass } from 'lucide-react';
import ToastHistoryModal from '@/components/ui/ToastHistoryModal';
import { useAuth } from '@/components/layout/AuthProvider';

interface NavItem { href: string; label: string }

/** Desktop links. Labels match MobileBottomNav so each destination has one name. */
const GUEST_LINKS: NavItem[] = [
  { href: '/',       label: 'Home' },
  { href: '/vault',  label: 'Vault' },
  { href: '/browse', label: 'Browse' },
];

const MEMBER_LINKS: NavItem[] = [
  { href: '/',          label: 'Home' },
  { href: '/vault',     label: 'My Vault' },
  { href: '/stream',    label: 'Stream' },
  { href: '/watchlist', label: 'Watch Later' },
  { href: '/diary',     label: 'Diary' },
  { href: '/browse',    label: 'Browse' },
  { href: '/add',       label: 'Log Film' },
];

export default function StreamRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function isActive(path: string) {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  const initial = profile?.display_name?.[0] ?? profile?.username?.[0] ?? user?.email?.[0] ?? '?';
  const displayName = profile?.display_name ?? profile?.username ?? user?.email ?? '';

  // Global 'N' shortcut → navigate to /add (auth-gated, skips input/textarea focus)
  useEffect(() => {
    if (!user) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        router.push('/add');
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [user, router]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dropdownOpen]);

  const links = user ? MEMBER_LINKS : GUEST_LINKS;
  const closeMenu = () => setDropdownOpen(false);

  return (
    <header className="unified-top-navbar">
      <div className="navbar-container unified-navbar-container">
        <div className="navbar-left-group">
          <Link href="/" className="navbar-logo" aria-label="Phantasm home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/apple-touch-icon.png?v=2"
              alt=""
              width={26}
              height={26}
              className="navbar-logo-icon-img"
            />
            <span className="navbar-logo-text">PHANTASM</span>
          </Link>

          <nav className="navbar-links-desktop" aria-label="Primary">
            {!loading && links.map(link => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`navbar-link${active ? ' active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="navbar-auth-desktop">
          <ToastHistoryModal />
          {loading ? (
            <div className="navbar-auth-loading" aria-hidden="true" />
          ) : user ? (
            <div className="navbar-profile-dropdown-container">
              <button
                type="button"
                className="navbar-profile-btn"
                onClick={() => setDropdownOpen(o => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                aria-label={`Account menu for ${displayName}`}
              >
                <span className="navbar-profile-avatar" aria-hidden="true">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" width={28} height={28} />
                  ) : (
                    initial.toUpperCase()
                  )}
                </span>
                <span className="navbar-profile-username">{displayName}</span>
                <ChevronDown size={14} className={`navbar-profile-chevron${dropdownOpen ? ' open' : ''}`} aria-hidden="true" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="navbar-dropdown-backdrop" onClick={closeMenu} aria-hidden="true" />
                  <div className="navbar-dropdown" role="menu">
                    <Link href="/profile" className="navbar-dropdown-item" role="menuitem" onClick={closeMenu}>
                      <User size={16} aria-hidden="true" />
                      Profile
                    </Link>
                    {/* Diary and Browse aren't in the 5-tab mobile bar — reachable here */}
                    <Link href="/diary" className="navbar-dropdown-item navbar-dropdown-mobile-only" role="menuitem" onClick={closeMenu}>
                      <BookOpen size={16} aria-hidden="true" />
                      Diary
                    </Link>
                    <Link href="/browse" className="navbar-dropdown-item navbar-dropdown-mobile-only" role="menuitem" onClick={closeMenu}>
                      <Compass size={16} aria-hidden="true" />
                      Browse
                    </Link>
                    <button
                      type="button"
                      className="navbar-dropdown-item navbar-dropdown-signout"
                      role="menuitem"
                      onClick={async () => {
                        closeMenu();
                        await signOut();
                        router.push('/login');
                        router.refresh();
                      }}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="navbar-guest-group">
              <span className="navbar-guest-label">Guest</span>
              {pathname !== '/login' && (
                <Link href="/login" className="navbar-signin-btn">
                  Sign in
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
