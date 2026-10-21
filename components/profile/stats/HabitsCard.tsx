import Link from 'next/link';
import type { ProfileStats } from '@/lib/profileStats';
import { formatRuntime } from '@/components/vault/format';

/** Logging pace and runtime facts. */
export default function HabitsCard({ pace, runtime }: Pick<ProfileStats, 'pace' | 'runtime'>) {
  return (
    <section className="stat-card" aria-labelledby="pstat-habits">
      <h3 id="pstat-habits" className="stat-card-label">Habits</h3>
      <dl className="pstat-figures is-compact">
        <div><dt>This month</dt><dd className="is-num">{pace.thisMonth}</dd></div>
        <div><dt>Per month</dt><dd className="is-num">{pace.perMonth}</dd></div>
        <div><dt>Week streak</dt><dd className="is-num">{pace.weekStreak}</dd></div>
        <div><dt>Best streak</dt><dd className="is-num">{pace.longestStreak}<small> wks</small></dd></div>
      </dl>
      {runtime.avg !== null && (
        <div className="stat-subsection">
          <h4 className="stat-subsection-title">Runtime</h4>
          <ul className="stat-facts">
            <li>Average film: <strong>{formatRuntime(runtime.avg)}</strong></li>
            {runtime.longest && (
              <li>Longest: <Link href={`/vault/${runtime.longest.id}`} className="pstat-link">{runtime.longest.title}</Link> <strong>{formatRuntime(runtime.longest.minutes)}</strong></li>
            )}
            {runtime.shortest && runtime.shortest.id !== runtime.longest?.id && (
              <li>Shortest: <Link href={`/vault/${runtime.shortest.id}`} className="pstat-link">{runtime.shortest.title}</Link> <strong>{formatRuntime(runtime.shortest.minutes)}</strong></li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
