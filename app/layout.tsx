import type { Metadata } from 'next';
import './globals.css';
import Navbar    from '@/components/Navbar';
import StarField from '@/components/StarField';

export const metadata: Metadata = {
  title:       'Horror Movie Tracker — Vault',
  description: 'Log and rate horror movies from any device. Your personal mobile-first horror film vault.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
