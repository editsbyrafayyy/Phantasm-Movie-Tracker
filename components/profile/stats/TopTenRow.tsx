import Link from 'next/link';
import type { FilmRef } from '@/lib/profileStats';
import FilmThumb from './FilmThumb';

export default function TopTenRow({ films }: { films: FilmRef[] }) {
  if (!films.length) return null;
  return (
    <section className="stat-card stat-card-wide" aria-labelledby="pstat-top">
      <h3 id="pstat-top" className="stat-card-label">Your top {films.length}</h3>
      <ol className="pstat-top-row">
        {films.map((f, i) => (
          <li key={f.id}>
            <Link href={`/vault/${f.id}`} className="pstat-top-item">
              <FilmThumb src={f.poster} className="pstat-top-poster" />
              <span className="pstat-top-rank">{i + 1}</span>
              <span className="pstat-top-title">{f.title}</span>
              <span className="pstat-top-score">{f.total}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
