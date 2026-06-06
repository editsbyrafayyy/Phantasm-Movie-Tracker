'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Film, Play, Plus, User } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [optimisticLoggedIn, setOptimisticLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    const cached = localStorage.getItem('vault_has_session');
    if (cached === 'true') {
      setOptimisticLoggedIn(true);
    } else if (cached === 'false') {
      setOptimisticLoggedIn(false);
    }
  }, []);

  // Sync with actual auth state once loaded
  useEffect(() => {
    if (!loading) {
      const hasSession = !!user;
      setOptimisticLoggedIn(hasSession);
      localStorage.setItem('vault_has_session', hasSession ? 'true' : 'false');
    }
  }, [user, loading]);

  function isActive(path: string) {
    if (path === '/') {
      return pathname === '/' ? ' active' : '';
    }
    return pathname.startsWith(path) ? ' active' : '';
  }

  // Use actual state if loaded, otherwise fallback to optimistic state, default to false (guest)
  const showLoggedIn = optimisticLoggedIn !== null ? optimisticLoggedIn : false;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link href="/" className={`mobile-bottom-nav-link${isActive('/')}`} prefetch={true}>
        <Home size={20} />
        <span>Vault</span>
      </Link>
      <Link href="/browse" className={`mobile-bottom-nav-link${isActive('/browse')}`} prefetch={true}>
        <Film size={20} />
        <span>Browse</span>
      </Link>
      <Link href="/stream" className={`mobile-bottom-nav-link${isActive('/stream')}`} prefetch={true}>
        <Play size={20} />
        <span>Stream</span>
      </Link>
      {showLoggedIn && (
        <Link href="/add" className={`mobile-bottom-nav-link${isActive('/add')}`} prefetch={true}>
          <Plus size={20} />
          <span>Log Film</span>
        </Link>
      )}
      <Link href="/profile" className={`mobile-bottom-nav-link${isActive('/profile')}`} prefetch={true}>
        <User size={20} />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
