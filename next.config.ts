import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
};

export default nextConfig;
