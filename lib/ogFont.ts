/**
 * Bebas Neue for next/og images. Google Fonts serves TrueType to a plain server
 * fetch (no browser UA), which Satori can read. Null on failure → default font.
 */
export async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch('https://fonts.googleapis.com/css2?family=Bebas+Neue', { cache: 'force-cache' })).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url, { cache: 'force-cache' });
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}
