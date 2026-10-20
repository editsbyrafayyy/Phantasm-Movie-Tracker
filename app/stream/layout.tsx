import type { ReactNode } from 'react';

export const metadata = {
  title: 'Stream — Phantasm',
  description: 'Stream horror films from the vault collection',
};

export default function StreamLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <div className="stream-main">
        {children}
      </div>
    </div>
  );
}
