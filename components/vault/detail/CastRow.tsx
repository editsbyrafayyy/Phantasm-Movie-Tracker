import Image from 'next/image';
import type { Movie } from '@/lib/types';

type CastItem = NonNullable<Movie['cast_list']>[number] | string;

function parseCast(item: CastItem): { name: string; character: string | null; profilePath: string | null } {
  let parsed: CastItem = item;
  if (typeof item === 'string') {
    try { parsed = JSON.parse(item); } catch { parsed = item; }
  }
  if (typeof parsed === 'string') return { name: parsed, character: null, profilePath: null };
  return { name: parsed.name, character: parsed.character ?? null, profilePath: parsed.profile_path ?? null };
}

/** Horizontal cast strip (cached TMDB cast on the movie row). */
export default function CastRow({ cast }: { cast: Movie['cast_list'] }) {
  return (
    <section className="detail-subsection" aria-labelledby="detail-cast-heading">
      <h2 id="detail-cast-heading" className="detail-subsection-title">Cast</h2>
      {cast && cast.length > 0 ? (
        <ul className="cast-row">
          {cast.map((item, i) => {
            const { name, character, profilePath } = parseCast(item as CastItem);
            return (
              <li key={`${name}-${i}`} className="cast-card">
                <div className="cast-avatar">
                  {profilePath ? (
                    <Image src={profilePath} alt="" fill className="detail-cover-img" sizes="64px" />
                  ) : (
                    <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="cast-info">
                  <p className="cast-name">{name}</p>
                  {character && <p className="cast-character">{character}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="cast-empty">No cast information yet.</p>
      )}
    </section>
  );
}
