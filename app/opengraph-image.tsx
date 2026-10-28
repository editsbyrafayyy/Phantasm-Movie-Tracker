import { ImageResponse } from 'next/og';
import { getOwnerEntries } from '@/lib/data';
import { loadDisplayFont } from '@/lib/ogFont';

export const alt = 'Phantasm — a horror film vault';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

const OWNER = process.env.NEXT_PUBLIC_OWNER_USERNAME ?? 'Rafayyy';

/** Site share card: the vault's name, size, and a strip of its best-rated posters. */
export default async function Image() {
  const [entries, font] = await Promise.all([getOwnerEntries().catch(() => []), loadDisplayFont()]);
  const posters = [...entries]
    .filter(e => e.movie?.poster_url)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 5)
    .map(e => e.movie.poster_url as string);
  const display = font ? 'Bebas' : undefined;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#080808', color: '#f2f2f2', padding: 56 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', fontFamily: display, fontSize: 30, letterSpacing: 6, color: '#e63232' }}>PHANTASM</div>
          <div style={{ display: 'flex', fontFamily: display, fontSize: 96, lineHeight: 1 }}>{`${OWNER}’s horror vault`}</div>
          <div style={{ display: 'flex', fontSize: 28, color: '#a0a0a0' }}>
            {`${entries.length} films rated, ranked and judged.`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {posters.map(src => (
            <img key={src} src={src} alt="" width={196} height={294} style={{ borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)' }} />
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: 'Bebas', data: font, style: 'normal', weight: 400 }] : undefined },
  );
}
