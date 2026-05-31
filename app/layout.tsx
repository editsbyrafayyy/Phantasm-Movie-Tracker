import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import Navbar    from '@/components/Navbar';
import StarField from '@/components/StarField';

export const metadata: Metadata = {
  title:       'Horror Movie Tracker — Vault',
  description: 'Log and rate horror movies from any device. Your personal mobile-first horror film vault.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.has('vault_unlocked');

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StarField />
        <Navbar isUnlocked={isUnlocked} />
        <main>{children}</main>
      </body>
    </html>
  );
}
