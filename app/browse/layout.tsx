import type { ReactNode } from 'react';
import StreamRail from '@/components/layout/StreamRail';

export const metadata = {
  title: 'Browse — Vault',
  description: 'Discover popular released horror films',
};

export default function BrowseLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <main className="stream-main">
        {children}
      </main>
    </div>
  );
}
