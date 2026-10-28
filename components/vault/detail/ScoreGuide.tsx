import { SCORE_FIELDS, RECOMMEND_COLOR } from '@/lib/config';

const HINTS: Record<string, string> = {
  atmosphere: 'Dread, mood and a sense of place',
  story:      'Premise, structure and payoff',
  characters: 'People worth fearing for',
  pacing:     'Tension that builds and never sags',
  visuals:    'Cinematography, effects and makeup',
  thrill:     'Scares that actually land',
  sound:      'Score and sound design',
  impact:     'How long it stays with you',
};

const VERDICTS: { label: string; meaning: string }[] = [
  { label: 'Peak',    meaning: 'Essential. Watch it.' },
  { label: 'Yes',     meaning: 'Worth your night.' },
  { label: 'No',      meaning: 'Skippable.' },
  { label: 'Garbage', meaning: 'Avoid. You’ve been warned.' },
];

/** What each scoring category measures, and what the verdicts mean. No hooks: server or client. */
export default function ScoreGuide() {
  return (
    <div className="score-guide">
      <p className="score-guide-intro">
        Eight categories add up to 10 — atmosphere and story count double. A bonus point marks something special the categories miss.
      </p>
      <dl className="score-guide-list">
        {SCORE_FIELDS.map(f => (
          <div key={f.key} className="score-guide-row">
            <dt>{f.label} <span className="score-guide-max">/{f.max}</span></dt>
            <dd>{HINTS[f.key]}</dd>
          </div>
        ))}
      </dl>
      <ul className="score-guide-verdicts">
        {VERDICTS.map(v => (
          <li key={v.label}>
            <span className="stat-legend-dot" style={{ background: RECOMMEND_COLOR[v.label] }} />
            <strong>{v.label}</strong> {v.meaning}
          </li>
        ))}
      </ul>
    </div>
  );
}
