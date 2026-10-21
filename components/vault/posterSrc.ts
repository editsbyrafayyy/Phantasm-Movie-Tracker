/**
 * Grid-sized poster URLs. next.config has `images.unoptimized`, so the browser downloads
 * whatever URL we hand it: ask the CDNs for a poster-sized rendition instead of the original.
 * Only ever shrinks — URLs already at or under grid size are returned unchanged.
 */
export function gridPosterUrl(url: string | null): string | null {
  if (!url) return null;
  // TMDB: /t/p/<size>/<file> — w342 covers a ~230px card at 1.5x.
  const tmdb = url.match(/^(https:\/\/image\.tmdb\.org\/t\/p\/)(w\d+|original)(\/.+)$/);
  if (tmdb) {
    const size = tmdb[2];
    const width = size === 'original' ? Infinity : Number(size.slice(1));
    return width > 342 ? `${tmdb[1]}w342${tmdb[3]}` : url;
  }
  // IMDb/Amazon: a bare `._V1_.jpg` is the full-size original; request a 400px-wide copy.
  if (url.startsWith('https://m.media-amazon.com/') && /\._V1_\.(jpg|png)$/.test(url)) {
    return url.replace(/\._V1_\.(jpg|png)$/, '._V1_SX400.$1');
  }
  return url;
}
