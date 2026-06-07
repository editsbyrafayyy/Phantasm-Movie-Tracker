import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        // OMDB / IMDb poster CDN
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/images/**',
      },
      {
        // OMDB direct poster URLs
        protocol: 'https',
        hostname: 'img.omdbapi.com',
        pathname: '/**',
      },
      {
        // TMDB backdrops and posters
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://m.media-amazon.com https://image.tmdb.org https://img.omdbapi.com",
              "frame-src 'self' https://vidsrc.to https://vidsrc.cc https://vidsrc.pm https://vidsrcme.ru https://vidlink.pro https://www.2embed.cc https://multiembed.mov https://www.youtube.com https://embed.su https://player.autoembed.cc https://autoembed.cc https://*.vidsrc.to https://*.vidsrc.cc https://*.vidsrc.pm https://*.vidsrcme.ru https://*.vidlink.pro https://*.2embed.cc https://*.multiembed.mov https://*.youtube.com https://*.embed.su https://*.autoembed.cc",
              "media-src 'self' blob: https://*.vidsrc.to https://*.vidsrc.cc https://*.vidsrc.pm https://*.vidsrcme.ru https://*.vidlink.pro https://*.2embed.cc https://*.multiembed.mov https://*.youtube.com https://*.embed.su https://*.autoembed.cc",
              "connect-src 'self' https://*.supabase.co",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
