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
    id: 'vidsrc-to', name: 'VidSrc.to', priority: 2,
    movieUrl: (id) =>         `https://vidsrc.to/embed/movie/${id}`,
    tvUrl:    (id, s, e) =>   `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc-me', name: 'VidSrc.me', priority: 3,
    movieUrl: (id, tmdb) =>   `https://vidsrcme.ru/embed/movie/${tmdb ?? id}`,
    tvUrl:    (id, s, e, tmdb) => `https://vidsrcme.ru/embed/tv/${tmdb ?? id}/${s}/${e}`,
  },
  {
    id: 'vidsrc-pm', name: 'VidSrc PM', priority: 4,
    movieUrl: (id) =>         `https://vidsrc.pm/v2/embed/movie/${id}`,
    tvUrl:    (id, s, e) =>   `https://vidsrc.pm/v2/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: '2embed', name: '2Embed', priority: 5,
    movieUrl: (id) =>         `https://www.2embed.cc/embed/movie/${id}`,
    tvUrl:    (id, s, e) =>   `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: 'multiembed', name: 'MultiEmbed', priority: 6,
    movieUrl: (id, tmdb) =>   `https://multiembed.mov/?video_id=${tmdb ?? id}&tmdb=1`,
    tvUrl:    (id, s, e, tmdb) => `https://multiembed.mov/?video_id=${tmdb ?? id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: 'vidsrc-cc', name: 'VidSrc.cc', priority: 7,
    movieUrl: (id) =>         `https://vidsrc.cc/v2/embed/movie/${id}`,
    tvUrl:    (id, s, e) =>   `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
];

// Returns providers sorted by priority (lowest first)
export function getProvidersInOrder(): Provider[] {
  return [...PROVIDERS].sort((a, b) => a.priority - b.priority);
}
