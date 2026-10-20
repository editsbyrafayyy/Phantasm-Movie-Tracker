import type { Entry } from '@/lib/types';

interface WrappedProps {
  entries: Entry[];
  year: number;
}

interface WrappedStat {
  label:   string;
  value:   string | number;
  subtext: string;
  /** Short numeric values render large in Bebas; titles render as text. */
  numeric?: boolean;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function pickLowlight(entries: Entry[]): { value: string; subtext: string } {
  const scored = entries.filter(e => (e.total ?? 0) > 0);
  if (!scored.length) return { value: '—', subtext: 'no rated films' };

  const byScore = [...scored].sort((a, b) => (a.total ?? 0) - (b.total ?? 0));
  const garbage = byScore.find(e => e.recommend === 'Garbage');
  if (garbage) return { value: garbage.movie?.title ?? '?', subtext: 'your biggest disappointment' };

  const lowest = byScore[0];
  return { value: lowest.movie?.title ?? '?', subtext: `your lowest score (${lowest.total})` };
}

function buildWrapped(thisYear: Entry[], year: number): WrappedStat[] {
  const rated = thisYear.filter(e => (e.total ?? 0) > 0);
  const totals = rated.map(e => e.total ?? 0);
  const avg = totals.length ? (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1) : '—';

  const topFilm = [...rated].sort((a, b) => (b.total ?? 0) - (a.total ?? 0))[0];

  const subgenreCounts = new Map<string, number>();
  for (const e of thisYear) {
    const sg = e.subgenre ?? 'Unknown';
    subgenreCounts.set(sg, (subgenreCounts.get(sg) ?? 0) + 1);
  }
  const topGenre = [...subgenreCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const peakCount = rated.filter(e => e.recommend === 'Peak').length;

  // 'YYYY-MM' keys, read straight from the timestamp string — no Date parsing,
  // so the month never shifts for viewers west of UTC.
  const monthCounts = new Map<string, number>();
  for (const e of thisYear) {
    const m = (e.created_at ?? '').slice(0, 7);
    if (m) monthCounts.set(m, (monthCounts.get(m) ?? 0) + 1);
  }
  const topMonth = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const monthLabel = topMonth ? MONTH_NAMES[Number(topMonth[0].slice(5, 7)) - 1] ?? '—' : '—';

  const lowlight = pickLowlight(thisYear);

  return [
    { label: 'Films logged',  value: thisYear.length,         subtext: `in ${year}`, numeric: true },
    { label: 'Avg score',     value: avg,                     subtext: 'out of 10', numeric: true },
    { label: 'Best film',     value: topFilm?.movie?.title ?? '—', subtext: `${topFilm?.total ?? '—'}/10` },
    { label: 'Top subgenre',  value: topGenre?.[0] ?? '—',    subtext: `${topGenre?.[1] ?? 0} films` },
    { label: 'Peak films',    value: peakCount,               subtext: 'rated "Peak"', numeric: true },
    { label: 'Busiest month', value: monthLabel,              subtext: `${topMonth?.[1] ?? 0} films logged` },
    { label: 'Active months', value: monthCounts.size,        subtext: 'out of 12', numeric: true },
    { label: 'Lowlight',      value: lowlight.value,          subtext: lowlight.subtext },
  ];
}

export default function PhantasmWrapped({ entries, year }: WrappedProps) {
  const prefix = String(year);
  const thisYear = entries.filter(e => (e.created_at ?? e.updated_at ?? '').startsWith(prefix));
  if (thisYear.length < 3) return null; // not enough data for a year in review

  const stats = buildWrapped(thisYear, year);

  return (
    <section className="wrapped-section" aria-labelledby="wrapped-title">
      <div className="wrapped-header">
        <p className="wrapped-eyebrow">Year in review</p>
        <h3 id="wrapped-title" className="wrapped-title">{year} <em className="page-header-accent">wrapped</em></h3>
        <p className="wrapped-sub">
          You logged <strong>{thisYear.length}</strong> films this year.
        </p>
      </div>

      <div className="wrapped-grid">
        {stats.map((stat, i) => (
          <div key={stat.label} className="wrapped-card" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="wrapped-card-label">{stat.label}</span>
            <strong
              className={`wrapped-card-value${stat.numeric ? ' is-numeric' : ''}`}
              title={String(stat.value)}
            >
              {stat.value}
            </strong>
            <span className="wrapped-card-sub">{stat.subtext}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
