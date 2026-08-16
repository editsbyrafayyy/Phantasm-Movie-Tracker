import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue, DM_Sans, Playfair_Display } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import { AuthProvider } from '@/components/layout/AuthProvider';
import StreamRail     from '@/components/layout/StreamRail';
import StarField        from '@/components/StarField';
import KeyboardShortcutsModal from '@/components/layout/KeyboardShortcutsModal';
import CommandPaletteModal from '@/components/layout/CommandPaletteModal';
import MobileBottomNav  from '@/components/layout/MobileBottomNav';

const inter = Inter({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
  variable: '--font-inter',
  display:  'swap',
});

const bebasNeue = Bebas_Neue({
  subsets:  ['latin'],
  weight:   ['400'],
  variable: '--font-display-neue',
  display:  'swap',
});

const dmSans = DM_Sans({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600'],
  style:    ['normal', 'italic'],
  variable: '--font-dm-sans',
  display:  'swap',
});

const playfairDisplay = Playfair_Display({
  subsets:  ['latin'],
  weight:   ['400'],
  style:    ['italic'],
  variable: '--font-serif-playfair',
  display:  'swap',
});

export const metadata: Metadata = {
  title:       'Phantasm — Horror Film Tracker',
  description: 'Log and rate horror films from any device. Your personal mobile-first horror film collection.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width:       'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable} ${dmSans.variable} ${playfairDisplay.variable}`} suppressHydrationWarning style={{ background: '#080808' }}>
      <head>
        {/* PWA / mobile theme — prevents white flash and colours OS chrome */}
        <meta name="theme-color" content="#080808" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#080808" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#080808" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="background-color" content="#080808" />
      </head>
      <body suppressHydrationWarning style={{ background: '#080808' }}>
        <NextTopLoader showSpinner={false} color="#e63232" height={3} />
        <AuthProvider>
          <StreamRail />
          <StarField />
          <main>{children}</main>
          <MobileBottomNav />
          <KeyboardShortcutsModal />
          <CommandPaletteModal />
        </AuthProvider>
      </body>
    </html>
  );
}
