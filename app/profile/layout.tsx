import type { ReactNode } from 'react';
import StreamRail from '@/components/layout/StreamRail';

export const metadata = {
  title: 'Profile — Vault',
  description: 'Manage your vault account',
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <StreamRail />
      <main className="stream-main">
        {children}
      </main>
    </div>
  );
}
