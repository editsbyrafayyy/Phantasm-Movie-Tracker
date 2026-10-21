interface Row {
  name:   string;
  /** Bar length, 0–100. */
  pct:    number;
  /** Right-hand value, e.g. a count. */
  value:  string | number;
  /** Optional secondary value, e.g. average score. */
  note?:  string | null;
}

/** Labelled horizontal bars — the one bar treatment on the profile page. */
export default function BarList({ rows, noteLabel }: { rows: Row[]; noteLabel?: string }) {
  return (
    <ul className="pstat-bars">
      {noteLabel && (
        <li className="pstat-bar-head" aria-hidden="true">
          <span /><span /><span>Films</span><span>{noteLabel}</span>
        </li>
      )}
      {rows.map(r => (
        <li key={r.name} className={`pstat-bar-row${r.note !== undefined ? ' has-note' : ''}`}>
          <span className="pstat-bar-name" title={r.name}>{r.name}</span>
          <span className="pstat-bar-track" aria-hidden="true">
            <span className="pstat-bar-fill" style={{ width: `${Math.max(2, Math.min(100, r.pct))}%` }} />
          </span>
          <span className="pstat-bar-value">{r.value}</span>
          {r.note !== undefined && <span className="pstat-bar-note">{r.note ?? '—'}</span>}
        </li>
      ))}
    </ul>
  );
}
