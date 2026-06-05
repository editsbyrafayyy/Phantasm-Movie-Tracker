'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Star, Plus, BarChart3, LogIn } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  function isActive(path: string) {
    return pathname === path ? ' active' : '';
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link href="/stream" className={`mobile-bottom-nav-link${isActive('/stream')}`}>
        <Home size={20} />
        <span>Home</span>
      </Link>
      <Link href="/browse" className={`mobile-bottom-nav-link${isActive('/browse')}`}>
        <Film size={20} />
        <span>Browse</span>
      </Link>
      {user ? (
        <>
          <Link href="/add" className={`mobile-bottom-nav-link${isActive('/add')}`}>
            <Plus size={20} />
            <span>Log Film</span>
          </Link>
          <Link href="/vault" className={`mobile-bottom-nav-link${isActive('/vault')}`}>
            <Star size={20} />
            <span>Ratings</span>
          </Link>
          <Link href="/stats" className={`mobile-bottom-nav-link${isActive('/stats')}`}>
            <BarChart3 size={20} />
            <span>Stats</span>
          </Link>
        </>
      ) : (
        <Link href="/login" className={`mobile-bottom-nav-link${isActive('/login')}`}>
          <LogIn size={20} />
          <span>Sign In</span>
        </Link>
      )}
    </nav>
  );
}
