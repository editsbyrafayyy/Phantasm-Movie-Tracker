'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home',      href: '/',      protected: false },
  { label: 'Add Movie', href: '/add',    protected: true },
  { label: 'Update',    href: '/update', protected: true },
];

export default function Navbar({ isUnlocked = false }: { isUnlocked?: boolean }) {
  const pathname = usePathname();
  const visibleLinks = NAV_LINKS.filter(link => !link.protected || isUnlocked);

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
    </nav>
  );
}
