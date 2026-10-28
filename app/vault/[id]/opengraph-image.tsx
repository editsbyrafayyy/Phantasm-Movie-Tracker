import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase/server';
import { RECOMMEND_COLOR } from '@/lib/config';
import { loadDisplayFont } from '@/lib/ogFont';

export const alt = 'A film rated on Phantasm';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OWNER = process.env.NEXT_PUBLIC_OWNER_USERNAME ?? 'Rafayyy';

interface Row {
  user_id: string;
  total: number | null;
  recommend: string | null;
  subgenre: string;
  movie: { title: string; year: number | null; director: string | null; poster_url: string | null } | null;
}

/** Share card: poster, score and verdict. Only the owner's public entries get one. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data }, font] = await Promise.all([
    createServiceClient()
      .from('entries')
      .select('user_id, total, recommend, subgenre, movie:movies (title, year, director, poster_url)')
      .eq('id', id)
      .maybeSingle(),
    loadDisplayFont(),
  ]);
  const row = data as unknown as Row | null;
  const entry = row && row.user_id === process.env.OWNER_USER_ID && row.movie ? row : null;

  const display = font ? 'Bebas' : undefined;
  const scored = entry && (entry.total ?? 0) > 0;
  const verdictColor = entry?.recommend ? RECOMMEND_COLOR[entry.recommend] ?? '#e63232' : '#e63232';
  const meta = entry ? [entry.movie!.year, entry.movie!.director, entry.subgenre].filter(Boolean).join('  ·  ') : '';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#080808', color: '#f2f2f2', padding: 56, gap: 56 }}>
        {entry?.movie?.poster_url && (
          <img src={entry.movie.poster_url} alt="" width={345} height={518} style={{ borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)' }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontFamily: display, fontSize: 30, letterSpacing: 6, color: '#e63232' }}>PHANTASM</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', fontFamily: display, fontSize: entry && entry.movie!.title.length > 26 ? 76 : 104, lineHeight: 0.95 }}>
              {entry ? entry.movie!.title : `${OWNER}’s horror vault`}
            </div>
            {meta && <div style={{ display: 'flex', fontSize: 26, color: '#a0a0a0' }}>{meta}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28 }}>
            {scored && (
              <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: display }}>
                <span style={{ fontSize: 132, lineHeight: 1, color: '#e63232' }}>{entry!.total}</span>
                <span style={{ fontSize: 44, color: '#606060', marginLeft: 8 }}>/ 10</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 18 }}>
              {entry?.recommend && (
                <div style={{ display: 'flex', alignSelf: 'flex-start', fontSize: 24, padding: '6px 16px', borderRadius: 999, border: `2px solid ${verdictColor}`, color: verdictColor }}>
                  {entry.recommend}
                </div>
              )}
              <div style={{ display: 'flex', fontSize: 22, color: '#a0a0a0' }}>Rated by {OWNER}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: 'Bebas', data: font, style: 'normal', weight: 400 }] : undefined },
  );
}
