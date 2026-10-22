'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// The first paint never animates (a fade-in would delay LCP); only in-app navigations do.
let hasNavigated = false;

/** Player pages get no transition — the video iframe should appear untouched. */
function isPlayerRoute(pathname: string) {
  if (pathname.startsWith('/stream/tmdb/')) return true;
  return /^\/stream\/[^/]+\/?$/.test(pathname);
}

/**
 * Re-keyed on every pathname change, so each new page (or its loading skeleton)
 * fades in. Search-param changes (filters, tabs) keep the same key and don't animate.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => { hasNavigated = true; }, []);
  const animate = hasNavigated && !isPlayerRoute(pathname);
  return (
    <div key={pathname} className={animate ? 'page-transition' : undefined}>
      {children}
    </div>
  );
}
