'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error caught by error boundary:', error);
  }, [error]);

  return (
    <div className="empty-state app-status-page" role="alert">
      <p className="page-header-eyebrow">Something broke</p>
      <h1 className="empty-state-title app-status-title">This page didn&apos;t load</h1>
      <p className="empty-state-body">
        An unexpected error interrupted things. Try again, or head back home.
      </p>
      <div className="app-status-actions">
        <button type="button" onClick={() => reset()} className="btn-primary">
          <RefreshCw size={16} aria-hidden="true" />
          Try again
        </button>
        <Link href="/" className="btn-secondary">Go home</Link>
      </div>
      {error.digest && <p className="app-status-digest">Error ref: {error.digest}</p>}
    </div>
  );
}
