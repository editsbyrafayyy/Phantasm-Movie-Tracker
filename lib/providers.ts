// lib/providers.ts

export type MediaType = 'movie' | 'tv';

export interface Provider {
  id:       string;
  name:     string;           // Display label in source switcher UI
  priority: number;           // Lower number = tried first
  movieUrl: (imdbId: string, tmdbId?: string | number | null) => string;
  tvUrl:    (imdbId: string, season: number, episode: number, tmdbId?: string | number | null) => string;
}

export const PROVIDERS: Provider[] = [
  {
    id: 'vidlink-pro', name: 'VidLink', priority: 1,
    movieUrl: (id, tmdb) =>   `https://vidlink.pro/movie/${tmdb ?? id}`,
    tvUrl:    (id, s, e, tmdb) => `https://vidlink.pro/tv/${tmdb ?? id}/${s}/${e}`,
  },
  {
    id: 'vidsrc-to', name: 'VidSrc', priority: 2,
    movieUrl: (id) =>         `https://vidsrc.to/embed/movie/${id}`,
    tvUrl:    (id, s, e) =>   `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidnest', name: 'VidNest', priority: 3,
    movieUrl: (_id, tmdb) =>        `https://vidnest.fun/movie/${tmdb}`,
    tvUrl:    (_id, s, e, tmdb) =>  `https://vidnest.fun/tv/${tmdb}/${s}/${e}`,
  },
  {
    id: '2embed', name: '2Embed', priority: 5,
    movieUrl: (id, tmdb) =>   `https://www.2embed.cc/embed/${id || tmdb}`,
    tvUrl:    (id, s, e, tmdb) => `https://www.2embed.cc/embedtv/${id || tmdb}&s=${s}&e=${e}`,
  },
];

// Returns providers sorted by priority (lowest first)
export function getProvidersInOrder(): Provider[] {
  return [...PROVIDERS].sort((a, b) => a.priority - b.priority);
}
