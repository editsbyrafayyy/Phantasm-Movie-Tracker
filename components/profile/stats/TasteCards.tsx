import type { ProfileStats } from '@/lib/profileStats';
import BarList from './BarList';

const fmtAvg = (n: number | null) => (n === null ? null : n.toFixed(1));

/** Subgenres: how much you watch each, and how well each scores with you. */
export function SubgenreCard({ data }: { data: ProfileStats['subgenres'] }) {
  if (!data.length) return null;
  const top = data.slice(0, 8);
  const max = top[0].count;
  return (
    <section className="stat-card" aria-labelledby="pstat-subgenres">
      <h3 id="pstat-subgenres" className="stat-card-label">Subgenres</h3>
      <BarList
        noteLabel="Avg"
        rows={top.map(s => ({ name: s.name, pct: (s.count / max) * 100, value: s.count, note: fmtAvg(s.avg) }))}
      />
      {data.length > top.length && (
        <p className="pstat-foot">+ {data.length - top.length} more subgenres</p>
      )}
    </section>
  );
}

/** Rating categories as a share of their maximum — what films earn from you. */
export function CategoryCard({ data }: { data: ProfileStats['categories'] }) {
  if (!data.length) return null;
  return (
    <section className="stat-card" aria-labelledby="pstat-cats">
      <h3 id="pstat-cats" className="stat-card-label">What you reward</h3>
      <p className="stat-card-desc">Average score in each category, as a share of its maximum.</p>
      <BarList rows={data.map(c => ({ name: c.label, pct: c.pct, value: `${c.pct}%` }))} />
    </section>
  );
}

export function DirectorsCard({ data }: { data: ProfileStats['directors'] }) {
  if (!data.length) return null;
  const max = data[0].count;
  return (
    <section className="stat-card" aria-labelledby="pstat-directors">
      <h3 id="pstat-directors" className="stat-card-label">Directors you return to</h3>
      <BarList
        noteLabel="Avg"
        rows={data.map(d => ({ name: d.name, pct: (d.count / max) * 100, value: d.count, note: fmtAvg(d.avg) }))}
      />
    </section>
  );
}

export function DecadesCard({ data }: { data: ProfileStats['decades'] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.count));
  return (
    <section className="stat-card" aria-labelledby="pstat-decades">
      <h3 id="pstat-decades" className="stat-card-label">Eras</h3>
      <BarList
        noteLabel="Avg"
        rows={data.map(d => ({ name: d.label, pct: (d.count / max) * 100, value: d.count, note: fmtAvg(d.avg) }))}
      />
    </section>
  );
}
