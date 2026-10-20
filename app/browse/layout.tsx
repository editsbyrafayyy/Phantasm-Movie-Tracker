import type { ReactNode } from 'react';

export const metadata = {
  title: 'Browse — Phantasm',
  description: 'Discover popular released horror films',
};

export default function BrowseLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <div className="stream-main">
        {children}
      </div>
    </div>
  );
}
