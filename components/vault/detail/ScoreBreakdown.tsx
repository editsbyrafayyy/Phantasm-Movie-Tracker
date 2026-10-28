'use client';

import { motion } from 'framer-motion';
import { SCORE_FIELDS } from '@/lib/config';
import { scoreBarVariant } from '@/lib/motion';
import ScoreGuide from './ScoreGuide';
import type { Entry } from '@/lib/types';

const fieldValue = (entry: Entry, key: string) => (entry[key as keyof Entry] as number | null) ?? null;

/** Per-criterion bars for an entry's eight scores and bonus. Unscored entries get a plain note. */
export default function ScoreBreakdown({ entry }: { entry: Entry }) {
  const hasScore = entry.total !== null && entry.total > 0;

  return (
    <section className="vdetail-breakdown" aria-labelledby="vdetail-breakdown-heading">
      <h2 id="vdetail-breakdown-heading" className="vdetail-side-title">Score breakdown</h2>

      {hasScore ? (
        <ul className="vdetail-bars">
          {SCORE_FIELDS.map(field => {
            const val = fieldValue(entry, field.key);
            const pct = val !== null ? (val / field.max) * 100 : 0;
            return (
              <li key={field.key} className="vdetail-bar-row">
                <span className="vdetail-bar-label">{field.label}</span>
                <span className="vdetail-bar-val">
                  {val ?? '–'}<span className="vdetail-bar-max">/{field.max}</span>
                </span>
                <span className="vdetail-bar-track" aria-hidden="true">
                  <motion.span className="vdetail-bar-fill" variants={scoreBarVariant(pct)} initial="initial" animate="animate" />
                </span>
              </li>
            );
          })}
          <li className="vdetail-bar-row vdetail-bonus">
            <span className="vdetail-bar-label">Bonus point</span>
            <span className="vdetail-bar-val">{entry.bonus ? '+1' : 'None'}</span>
          </li>
        </ul>
      ) : (
        <p className="vdetail-side-empty">
          Not scored yet. The breakdown appears once this film is rated.
        </p>
      )}

      <details className="vdetail-howto">
        <summary>How the score works</summary>
        <ScoreGuide />
      </details>
    </section>
  );
}
