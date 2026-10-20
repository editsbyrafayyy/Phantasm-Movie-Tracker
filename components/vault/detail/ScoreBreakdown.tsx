'use client';

import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { SCORE_FIELDS } from '@/lib/config';
import { scoreBarVariant } from '@/lib/motion';
import type { Entry } from '@/lib/types';

const fieldValue = (entry: Entry, key: string) => (entry[key as keyof Entry] as number | null) ?? null;

/** Radar + per-criterion bars for an entry's eight scores and bonus. */
export default function ScoreBreakdown({ entry }: { entry: Entry }) {
  const hasScore = entry.total !== null && entry.total > 0;

  const radarData = SCORE_FIELDS.map(f => {
    const raw = fieldValue(entry, f.key) ?? 0;
    return { subject: f.label, value: Math.round((raw / f.max) * 100), rawVal: raw, max: f.max };
  });

  return (
    <section className="vault-ratings-section" aria-labelledby="vault-ratings-heading">
      <div className="vault-ratings-header">
        <h2 id="vault-ratings-heading" className="vault-ratings-label">Vault ratings</h2>
      </div>

      {hasScore && (
        <div className="score-radar-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text)',
                }}
                formatter={(_: unknown, __: unknown, props: { payload?: { rawVal: number; max: number } }) => [
                  `${props.payload?.rawVal ?? 0} / ${props.payload?.max ?? 1}`,
                  'Score',
                ]}
              />
              <Radar name="Score" dataKey="value" stroke="#e63232" fill="#e63232" fillOpacity={0.18} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="score-bars">
        {SCORE_FIELDS.map(field => {
          const val = fieldValue(entry, field.key);
          const pct = val !== null ? (val / field.max) * 100 : 0;
          return (
            <div key={field.key} className="score-bar-row">
              <span className="score-bar-label">{field.label}</span>
              <div className="score-bar-track" aria-hidden="true">
                <motion.div className="score-bar-fill" variants={scoreBarVariant(pct)} initial="initial" animate="animate" />
              </div>
              <span className="score-bar-val">
                {val ?? '—'}
                {val !== null && <span className="score-bar-max">/{field.max}</span>}
              </span>
            </div>
          );
        })}
        <div className="score-bar-row">
          <span className="score-bar-label">Bonus</span>
          <div className="score-bar-track" aria-hidden="true">
            <motion.div className="score-bar-fill" variants={scoreBarVariant(entry.bonus ? 100 : 0)} initial="initial" animate="animate" />
          </div>
          <span className="score-bar-val">{entry.bonus ? '+1' : '0'}</span>
        </div>
      </div>
    </section>
  );
}
