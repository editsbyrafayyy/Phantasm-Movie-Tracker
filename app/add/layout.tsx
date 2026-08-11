import type { ReactNode } from 'react';
import StreamRail from '@/components/layout/StreamRail';

export const metadata = {
  title: 'Log Film — Phantasm',
  description: 'Log and rate a new film',
};

export default function AddLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <main className="stream-main">
        {children}
      </main>
    </div>
  );
}
