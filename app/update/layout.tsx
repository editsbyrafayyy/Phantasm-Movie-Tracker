import type { ReactNode } from 'react';
import StreamRail from '@/components/layout/StreamRail';

export const metadata = {
  title: 'Edit Rating — Vault',
  description: 'Edit your film ratings',
};

export default function UpdateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <main className="stream-main">
        {children}
      </main>
    </div>
  );
}
