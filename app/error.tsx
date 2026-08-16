'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Skull, RefreshCw, Home } from 'lucide-react';

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
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(230, 50, 50, 0.1)',
          border: '1px solid rgba(230, 50, 50, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--red)',
          marginBottom: 20,
        }}
      >
        <Skull size={32} strokeWidth={1.75} />
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-display-neue), var(--font-sans)',
          fontSize: 'clamp(28px, 5vw, 40px)',
          letterSpacing: '1px',
          color: '#ffffff',
          margin: '0 0 8px',
          textTransform: 'uppercase',
        }}
      >
        Something went dark
      </h2>

      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '14px',
          maxWidth: '420px',
          lineHeight: 1.6,
          margin: '0 0 28px',
        }}
      >
        An unexpected disturbance interrupted the transmission. Try reloading the signal or head back to safety.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => reset()}
          className="btn-watch"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textTransform: 'none',
            fontSize: '13px',
            padding: '10px 20px',
          }}
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>

        <Link
          href="/"
          className="btn-outline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            padding: '10px 20px',
          }}
        >
          <Home size={14} />
          <span>Back to Vault</span>
        </Link>
      </div>
    </div>
  );
}
