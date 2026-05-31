'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Home',      href: '/'    },
  { label: 'Add Movie', href: '/add' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar-pill" aria-label="Main navigation">
      {/* Logo */}
      <Link href="/" className="navbar-pill-logo">
        <span className="navbar-pill-logo-icon" aria-hidden="true">☽</span>
        <span>VAULT</span>
      </Link>

      {/* Divider */}
      <div className="navbar-pill-divider" aria-hidden="true" />

      {/* Nav links */}
      <div className="navbar-pill-links">
        {NAV_LINKS.map(({ label, href }) => (
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
