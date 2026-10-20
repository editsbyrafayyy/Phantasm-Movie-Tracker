import type { ReactNode } from 'react';

export const metadata = {
  title: 'Log Film — Phantasm',
  description: 'Log and rate a new film',
};

export default function AddLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <div className="stream-main">
        {children}
      </div>
    </div>
  );
}
