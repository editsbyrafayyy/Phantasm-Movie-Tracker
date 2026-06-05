'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Home, Film, Star, Plus, BarChart3, User, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';

export default function StreamRail() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  function isActive(path: string) {
    return pathname === path ? ' active' : '';
  }

  return (
    <nav className="stream-rail" aria-label="Streaming navigation">

      {/* Logo */}
      <Link href="/" className="stream-rail-logo">
        <Moon size={18} className="stream-rail-logo-icon" />
        <span className="stream-rail-logo-text">VAULT</span>
      </Link>

      {/* Media */}
      <p className="stream-rail-section-heading">Media</p>
      <Link href="/stream" className={`stream-rail-link${isActive('/stream')}`}>
        <Home size={16} className="stream-rail-icon" />
        <span className="stream-rail-label-text">Home</span>
      </Link>
      <Link href="/browse" className={`stream-rail-link${isActive('/browse')}`}>
        <Film size={16} className="stream-rail-icon" />
        <span className="stream-rail-label-text">Browse</span>
      </Link>

      {/* Vault (auth required) */}
      {user && (
        <>
          <p className="stream-rail-section-heading">Vault</p>
          <Link href="/vault" className={`stream-rail-link${isActive('/vault')}`}>
            <Star size={16} className="stream-rail-icon" />
            <span className="stream-rail-label-text">My Ratings</span>
          </Link>
          <Link href="/add" className={`stream-rail-link${isActive('/add')}`}>
            <Plus size={16} className="stream-rail-icon" />
            <span className="stream-rail-label-text">Log a Film</span>
          </Link>
          <Link href="/stats" className={`stream-rail-link${isActive('/stats')}`}>
            <BarChart3 size={16} className="stream-rail-icon" />
            <span className="stream-rail-label-text">My Stats</span>
          </Link>
        </>
      )}

      {/* Account */}
      <div style={{ flex: 1 }} />
      <p className="stream-rail-section-heading">Account</p>

      {user ? (
        <>
          <Link href="/profile" className={`stream-rail-link${isActive('/profile')}`}>
            <User size={16} className="stream-rail-icon" />
            <span className="stream-rail-label-text">Profile</span>
          </Link>
          <button className="stream-rail-link" onClick={signOut} style={{ borderLeft: '2px solid transparent' }}>
            <LogOut size={16} className="stream-rail-icon" />
            <span className="stream-rail-label-text">Sign Out</span>
          </button>
        </>
      ) : (
        <Link href="/login" className={`stream-rail-link${isActive('/login')}`}>
          <LogIn size={16} className="stream-rail-icon" />
          <span className="stream-rail-label-text">Sign In</span>
        </Link>
      )}
    </nav>
  );
}
