// ── Column map — mirrors CFG.COL in Code.gs exactly ──────────────────────────
export const COL = {
  TITLE:          2,  // B
  SUBGENRE:       3,  // C
  SECONDARY_TAG:  4,  // D
  RECOMMEND:      5,  // E
  ATMOSPHERE:     6,  // F
  STORY:          7,  // G
  CHARACTERS:     8,  // H
  PACING:         9,  // I
  VISUALS:        10, // J
  THRILL:         11, // K
  SOUND:          12, // L
  IMPACT:         13, // M
  TOTAL:          14, // N
  BONUS:          15, // O
} as const;

export const DATA_START_ROW = 3; // Row 1 = count, Row 2 = header, Row 3 = first data row
export const BORDER_COL_END = 15; // O

// ── Subgenres (13) ────────────────────────────────────────────────────────────
export const SUBGENRES = [
  'Psychological Horror',
  'Supernatural Horror',
  'Folk Horror',
  'Religious/Occult Horror',
  'Creature Feature',
  'Slasher',
  'Zombie Horror',
  'Survival Horror',
  'Found Footage Horror',
  'Sci-Fi Horror',
  'Gore/Extreme Horror',
  'Horror Comedy',
  'Thriller (Non-Horror)',
] as const;

// ── Secondary tags (11) ───────────────────────────────────────────────────────
export const SECONDARY_TAGS = [
  'Haunted House',
  'Possession/Demonic Entities',
  'Cults/Rituals',
  'Found Footage',
  'Isolation/Claustrophobic Setting',
  'Creature/Monster/Animal Attack',
  'Slasher Killer',
  'Paranormal Investigation',
  'Apocalyptic/Post-Apocalyptic',
  'Body Horror',
  'Psychological Breakdown',
] as const;

// ── Score field definitions ───────────────────────────────────────────────────
export const SCORE_FIELDS = [
  { key: 'atmosphere', label: 'Atmosphere', max: 2 },
  { key: 'story',      label: 'Story',      max: 2 },
  { key: 'characters', label: 'Characters', max: 1 },
  { key: 'pacing',     label: 'Pacing',     max: 1 },
  { key: 'visuals',    label: 'Visuals',    max: 1 },
  { key: 'thrill',     label: 'Thrill',     max: 1 },
  { key: 'sound',      label: 'Sound',      max: 1 },
  { key: 'impact',     label: 'Impact',     max: 1 },
] as const;

// ── TypeScript types ──────────────────────────────────────────────────────────
export type ScoreKey      = typeof SCORE_FIELDS[number]['key'];
export type Subgenre      = typeof SUBGENRES[number];
export type SecondaryTag  = typeof SECONDARY_TAGS[number];
export type Recommend     = 'Yes' | 'No' | 'Peak' | 'Garbage' | '';
