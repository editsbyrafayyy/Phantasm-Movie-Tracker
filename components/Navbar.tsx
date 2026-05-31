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
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          🎬 <span>VAULT</span>
        </Link>

        {/* Nav links */}
        <div className="navbar-links">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`navbar-link${pathname === href ? ' active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
