import { SCORE_FIELDS, RECOMMEND_COLOR } from '@/lib/config';

const HINTS: Record<string, string> = {
  atmosphere: 'Does it actually feel unsettling, or does it just look the part?',
  story:      'Whether the premise holds up, and whether the ending earns it.',
  characters: 'People worth caring about, or at least not actively rooting against.',
  pacing:     'Slow is fine. Aimless is not.',
  visuals:    'Cinematography, practical effects, makeup.',
  thrill:     'Did it get to me at any point?',
  sound:      'Score and sound design. The stuff you only notice when it works.',
  impact:     'Was I still thinking about it the next day?',
};

const VERDICTS: { label: string; meaning: string }[] = [
  { label: 'Peak',    meaning: 'I would recommend it to anyone.' },
  { label: 'Yes',     meaning: 'Worth the watch.' },
  { label: 'No',      meaning: 'I would skip it.' },
  { label: 'Garbage', meaning: 'Not worth anyone’s time.' },
];

/** What each scoring category measures, and what the verdicts mean. No hooks: server or client. */
export default function ScoreGuide() {
  return (
    <div className="score-guide">
      <p className="score-guide-intro">
        I set the scoring up so every film gets judged the same way. Eight categories, with atmosphere and story worth 2 points each and the rest worth 1, which adds up to 10. The bonus point is for the rare one that does something the categories can&rsquo;t really capture.
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
