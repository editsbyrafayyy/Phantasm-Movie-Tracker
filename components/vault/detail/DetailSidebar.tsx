import type { Entry } from '@/lib/types';
import ScoreBreakdown from './ScoreBreakdown';
import { formatRuntime } from '../format';

const ADDED_FMT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Score breakdown + film facts. One panel; rows with no data are left out. */
export default function DetailSidebar({ entry }: { entry: Entry }) {
  const { movie } = entry;
  const added = entry.created_at ? ADDED_FMT.format(new Date(entry.created_at)) : null;
  const facts: [string, string][] = [
    ['Released', movie.year ? String(movie.year) : null],
    ['Runtime', formatRuntime(movie.runtime_min)],
    ['Director', movie.director ?? null],
    ['IMDb', movie.imdb_rating ? `${movie.imdb_rating} / 10` : null],
    ['Added', added],
  ].filter((f): f is [string, string] => !!f[1]);

  return (
    <aside className="vdetail-side" aria-label="Score and details">
      <ScoreBreakdown entry={entry} />
      {facts.length > 0 && (
        <dl className="vdetail-facts">
          {facts.map(([k, v]) => (
            <div key={k} className="vdetail-fact">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  );
}
