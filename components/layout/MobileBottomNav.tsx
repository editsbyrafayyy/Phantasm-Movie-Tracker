'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { Plus } from 'lucide-react';
import { HauntedHouse, Coffin, WatchingEye, Gravestone, SkeletonKey, type IconComponent } from '@/components/ui/HorrorIcons';
import { useAuth } from '@/components/layout/AuthProvider';

const SESSION_HINT_KEY = 'vault_has_session';

interface Tab { href: string; label: string; icon: IconComponent; primary?: boolean }

// Max 5 tabs. Profile lives in the avatar menu (StreamRail).
const MEMBER_TABS: Tab[] = [
  { href: '/',          label: 'Home',        icon: HauntedHouse },
  { href: '/vault',     label: 'My Vault',    icon: Coffin },
  { href: '/add',       label: 'Log Film',    icon: Plus, primary: true },
  { href: '/watchlist', label: 'Watch Later', icon: Gravestone },
  { href: '/stream',    label: 'Stream',      icon: WatchingEye },
];

const GUEST_TABS: Tab[] = [
  { href: '/',       label: 'Home',    icon: HauntedHouse },
  { href: '/vault',  label: 'Vault',   icon: Coffin },
  { href: '/login',  label: 'Sign in', icon: SkeletonKey },
];

// Cached "was signed in last visit" hint so the right tab set shows before auth resolves.
const noopSubscribe = () => () => {};
function readSessionHint(): boolean | null {
  try {
    const v = localStorage.getItem(SESSION_HINT_KEY);
    return v === 'true' ? true : v === 'false' ? false : null;
  } catch {
    return null;
  }
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const cachedHint = useSyncExternalStore(noopSubscribe, readSessionHint, () => null);

  // Persist the hint once auth has resolved.
  useEffect(() => {
    if (loading) return;
    try { localStorage.setItem(SESSION_HINT_KEY, user ? 'true' : 'false'); } catch { /* storage blocked */ }
  }, [user, loading]);

  const showLoggedIn = loading ? cachedHint === true : !!user;
  const tabs = showLoggedIn ? MEMBER_TABS : GUEST_TABS;

  function isActive(path: string) {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      {tabs.map(({ href, label, icon: Icon, primary }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`mobile-bottom-nav-link${primary ? ' mobile-bottom-nav-add' : ''}${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {primary ? (
              <span className="mobile-nav-add-icon" aria-hidden="true"><Icon size={16} /></span>
            ) : (
              <Icon size={20} aria-hidden="true" />
            )}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
