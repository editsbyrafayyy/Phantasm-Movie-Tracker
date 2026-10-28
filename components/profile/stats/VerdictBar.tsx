import { RECOMMEND_COLOR } from '@/lib/config';

/** Stacked bar + legend of Peak / Yes / No / Garbage verdicts. */
export default function VerdictBar({ verdicts }: { verdicts: { label: string; count: number }[] }) {
  const total = verdicts.reduce((s, v) => s + v.count, 0);
  if (!total) return null;
  return (
    <div className="profile-verdicts">
      <div className="stat-stack-bar" aria-hidden="true">
        {verdicts.map(v => (
          <span key={v.label} style={{ width: `${(v.count / total) * 100}%`, background: RECOMMEND_COLOR[v.label] }} />
        ))}
      </div>
      <ul className="stat-legend">
        {verdicts.map(v => (
          <li key={v.label} className="stat-legend-item">
            <span className="stat-legend-dot" style={{ background: RECOMMEND_COLOR[v.label] }} />
            {v.label} <strong>{v.count}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
