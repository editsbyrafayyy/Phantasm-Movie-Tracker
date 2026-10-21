import Link from 'next/link';
import type { ProfileStats } from '@/lib/profileStats';

/** Compact year in review — only what the headline numbers don't already say. */
export default function YearCard({ data }: { data: NonNullable<ProfileStats['year']> }) {
  const delta = data.vsAllTime;
  return (
    <section className="stat-card stat-card-wide pstat-year" aria-labelledby="pstat-year">
      <h3 id="pstat-year" className="pstat-year-title">
        {data.year} <em className="page-header-accent">so far</em>
      </h3>
      <dl className="pstat-figures">
        <div>
          <dt>Films logged</dt>
          <dd className="is-num">{data.logged}</dd>
        </div>
        <div>
          <dt>Average score</dt>
          <dd className="is-num">
            {data.avgScore ?? '—'}
            {delta !== null && delta !== 0 && (
              <span className={`pstat-delta ${delta > 0 ? 'is-up' : 'is-down'}`}>
                {delta > 0 ? '+' : '−'}{Math.abs(delta).toFixed(1)}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>Busiest month</dt>
          <dd>{data.busiestMonth ? <>{data.busiestMonth.name} <small>{data.busiestMonth.count} films</small></> : '—'}</dd>
        </div>
        <div>
          <dt>Months active</dt>
          <dd className="is-num">{data.activeMonths}<small> / 12</small></dd>
        </div>
        {data.letdown && (
          <div className="pstat-figure-wide">
            <dt>Biggest letdown</dt>
            <dd>
              <Link href={`/vault/${data.letdown.id}`} className="pstat-link">{data.letdown.title}</Link>
              <small> {data.letdown.total}/10</small>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
