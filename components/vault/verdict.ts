import { RECOMMEND_COLOR } from '@/lib/config';

/** Verdict order, best to worst. Stored in `entries.recommend`. */
export const VERDICTS = ['Peak', 'Yes', 'No', 'Garbage'] as const;
export type Verdict = typeof VERDICTS[number];

/** Human label for each stored verdict value. */
export const VERDICT_LABEL: Record<string, string> = {
  Peak:    'Peak',
  Yes:     'Recommended',
  No:      'Not recommended',
  Garbage: 'Garbage',
};

/** Short label that fits on a poster card. */
export const VERDICT_SHORT: Record<string, string> = {
  Peak:    'Peak',
  Yes:     'Recommended',
  No:      'Skip',
  Garbage: 'Garbage',
};

export function verdictColor(v: string | null | undefined): string | undefined {
  return v ? RECOMMEND_COLOR[v] : undefined;
}
