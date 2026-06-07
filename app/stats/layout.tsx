import type { ReactNode } from 'react';
import StreamRail from '@/components/layout/StreamRail';

export const metadata = {
  title: 'My Stats — Vault',
  description: 'Visualize your film vault statistics',
};

export default function StatsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <main className="stream-main">
        {children}
      </main>
    </div>
  );
}
