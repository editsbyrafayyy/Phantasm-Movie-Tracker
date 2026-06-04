import type { ReactNode } from 'react';
import StreamRail from '@/components/layout/StreamRail';

export const metadata = {
  title: 'Stream — Vault',
  description: 'Stream horror films from the vault collection',
};

export default function StreamLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <StreamRail />
      <main className="stream-main">
        {children}
      </main>
    </div>
  );
}
