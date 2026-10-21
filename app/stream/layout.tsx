import type { ReactNode } from 'react';

export const metadata = {
  title: 'Stream — Phantasm',
  description: 'Popular and new horror films and series, filtered by subgenre or mood.',
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
