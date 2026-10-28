import Link from 'next/link';
import type { HotTake } from '@/lib/profileStats';
import FilmThumb from './FilmThumb';

function TakeList({ title, items, who }: { title: string; items: HotTake[]; who?: string }) {
  if (!items.length) return null;
  return (
    <div className="pstat-takes-col">
      <h4 className="stat-subsection-title">{title}</h4>
      <ul className="pstat-list">
        {items.map(t => (
          <li key={t.id}>
            <Link href={`/vault/${t.id}`} className="pstat-film-row">
              <FilmThumb src={t.poster} />
              <span className="pstat-film-main">
                <span className="pstat-film-title">{t.title}</span>
                <span className="pstat-film-sub">{who ?? 'You'} {t.total} · IMDb {t.imdb}</span>
              </span>
              <span className={`pstat-delta ${t.delta > 0 ? 'is-up' : 'is-down'}`}>
                {t.delta > 0 ? '+' : '−'}{Math.abs(t.delta).toFixed(1)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Where your score disagrees most with IMDb's. */
export default function HotTakes({ above, below, who }: { above: HotTake[]; below: HotTake[]; who?: string }) {
  if (!above.length && !below.length) return null;
  return (
    <section className="stat-card" aria-labelledby="pstat-takes">
      <h3 id="pstat-takes" className="stat-card-label">Hot takes</h3>
      <p className="stat-card-desc">Films where {who ?? 'you'} and IMDb disagree the most.</p>
      <div className="pstat-takes">
        <TakeList title={who ? `${who} rates higher` : 'You rate higher'} items={above} who={who} />
        <TakeList title={who ? `${who} rates lower` : 'You rate lower'} items={below} who={who} />
      </div>
    </section>
  );
}
