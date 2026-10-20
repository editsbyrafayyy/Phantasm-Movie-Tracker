import type { ReactNode } from 'react';

export const metadata = {
  title: 'My Ratings — Phantasm',
  description: 'Your logged and rated film collection',
};

export default function VaultLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <div className="stream-main">
        {children}
      </div>
    </div>
  );
}
