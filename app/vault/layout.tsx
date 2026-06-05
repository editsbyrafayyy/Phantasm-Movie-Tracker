import type { ReactNode } from 'react';
import StreamRail from '@/components/layout/StreamRail';

export const metadata = {
  title: 'My Ratings — Vault',
  description: 'Your logged and rated film vault',
};

export default function VaultLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <StreamRail />
      <main className="stream-main">
        {children}
      </main>
    </div>
  );
}
