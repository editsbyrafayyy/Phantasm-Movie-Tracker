import type { ReactNode } from 'react';

export const metadata = {
  title: 'Edit Rating — Phantasm',
  description: 'Edit your film ratings',
};

export default function UpdateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <div className="stream-main">
        {children}
      </div>
    </div>
  );
}
