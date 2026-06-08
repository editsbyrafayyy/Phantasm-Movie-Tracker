'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Clapperboard, Compass, Play, Plus, User, LogIn } from 'lucide-react';
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

  const ICON_SIZE = 22;
  const STROKE_WIDTH = 1.5;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link href="/" className={`mobile-bottom-nav-link${isActive('/')}`} prefetch={true}>
        <Clapperboard size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
        <span>Vault</span>
      </Link>
      
      {showLoggedIn ? (
        <>
          <Link href="/browse" className={`mobile-bottom-nav-link${isActive('/browse')}`} prefetch={true}>
            <Compass size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
            <span>Browse</span>
          </Link>
          <Link href="/stream" className={`mobile-bottom-nav-link${isActive('/stream')}`} prefetch={true}>
            <Play size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
            <span>Stream</span>
          </Link>
          <Link href="/add" className={`mobile-bottom-nav-link${isActive('/add')}`} prefetch={true}>
            <Plus size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
            <span>Log Film</span>
          </Link>
          <Link href="/profile" className={`mobile-bottom-nav-link${isActive('/profile')}`} prefetch={true}>
            <User size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
            <span>Profile</span>
          </Link>
        </>
      ) : (
        <Link href="/login" className={`mobile-bottom-nav-link${isActive('/login')}`} prefetch={true}>
          <LogIn size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
          <span>Sign In</span>
        </Link>
      )}
    </nav>
  );
}
