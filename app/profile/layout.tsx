import type { ReactNode } from 'react';

export const metadata = {
  title: 'Profile — Phantasm',
  description: 'Manage your Phantasm account',
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream-layout">
      <main className="stream-main">
        {children}
      </main>
    </div>
  );
}
