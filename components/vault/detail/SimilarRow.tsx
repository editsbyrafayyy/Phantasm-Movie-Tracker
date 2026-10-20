import Image from 'next/image';
import Link from 'next/link';
import { Film } from 'lucide-react';
import type { RelatedEntry } from '@/lib/types';

/** "More like this" — same subgenre, closest score, from the same vault. */
export default function SimilarRow({ entries }: { entries: RelatedEntry[] }) {
  return (
    <section className="detail-subsection" aria-labelledby="detail-similar-heading">
      <h2 id="detail-similar-heading" className="detail-subsection-title">More like this</h2>
      {entries.length > 0 ? (
        <ul className="similar-row">
          {entries.map(e => {
            const img = e.movie.poster_url ?? e.movie.backdrop_url ?? null;
            const scored = e.total !== null && e.total > 0;
            return (
              <li key={e.id}>
                <Link
                  href={`/vault/${e.id}`}
                  className="similar-card"
                  aria-label={`${e.movie.title}${scored ? `, score ${e.total}` : ''}`}
                >
                  <div className="similar-poster">
                    {img ? (
                      <Image src={img} alt="" fill className="detail-cover-img" sizes="(max-width: 640px) 33vw, 120px" />
                    ) : (
                      <div className="similar-poster-fallback"><Film size={32} aria-hidden="true" /></div>
                    )}
                    {scored && <span className="movie-card-score similar-score-badge" aria-hidden="true">{e.total}</span>}
                  </div>
                  <p className="similar-title">{e.movie.title}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="cast-empty">No similar films in the vault yet.</p>
      )}
    </section>
  );
}
