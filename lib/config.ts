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

// ── Subgenre → CSS variable key map (for coloring genre chips/charts) ─────────
export const SUBGENRE_COLOR_KEY: Record<string, string> = {
  'Psychological Horror':  'psychological',
  'Supernatural Horror':   'supernatural',
  'Folk Horror':           'folk',
  'Religious/Occult Horror': 'occult',
  'Creature Feature':      'creature',
  'Slasher':               'slasher',
  'Zombie Horror':         'zombie',
  'Survival Horror':       'survival',
  'Found Footage Horror':  'found-footage',
  'Sci-Fi Horror':         'scifi',
  'Gore/Extreme Horror':   'gore',
  'Horror Comedy':         'comedy',
  'Thriller (Non-Horror)': 'thriller',
};

// Hex values matching the CSS vars — used by Recharts which needs concrete colors
export const SUBGENRE_HEX: Record<string, string> = {
  'Psychological Horror':  '#F4CCCC',
  'Supernatural Horror':   '#FCE5CD',
  'Folk Horror':           '#D9EAD3',
  'Religious/Occult Horror': '#D9D2E9',
  'Creature Feature':      '#CFE2F3',
  'Slasher':               '#CC0000',
  'Zombie Horror':         '#B6D7A8',
  'Survival Horror':       '#0B5394',
  'Found Footage Horror':  '#7B2FBE',
  'Sci-Fi Horror':         '#C9DAF8',
  'Gore/Extreme Horror':   '#E06666',
  'Horror Comedy':         '#FFF2CC',
  'Thriller (Non-Horror)': '#1155CC',
};

export const RECOMMEND_COLOR: Record<string, string> = {
  Yes:     '#4a7c3f',
  No:      '#CC0000',
  Peak:    '#6a2fa0',
  Garbage: '#595959',
};

// ── TypeScript types ──────────────────────────────────────────────────────────
export type ScoreKey      = typeof SCORE_FIELDS[number]['key'];
export type Subgenre      = typeof SUBGENRES[number];
export type SecondaryTag  = typeof SECONDARY_TAGS[number];
export type Recommend     = 'Yes' | 'No' | 'Peak' | 'Garbage' | '';

// ── Score calculation ─────────────────────────────────────────────────────────
export function computeTotal(fields: {
  atmosphere: number | '';
  story:      number | '';
  characters: number | '';
  pacing:     number | '';
  visuals:    number | '';
  thrill:     number | '';
  sound:      number | '';
  impact:     number | '';
  bonus:      0 | 1;
}): number {
  const sum = SCORE_FIELDS.reduce((acc, f) => {
    const v = fields[f.key as ScoreKey];
    return acc + (typeof v === 'number' ? v : 0);
  }, 0);
  return sum + fields.bonus;
}

// ── Built-in Horror Franchises ────────────────────────────────────────────────
export const FRANCHISES: { name: string; pattern: RegExp }[] = [
  { name: 'Scream Collection',            pattern: /\bScream\b/i },
  { name: 'Saw Franchise',                pattern: /\b(Saw|Jigsaw|Spiral)\b/i },
  { name: 'Halloween Franchise',          pattern: /\bHalloween\b/i },
  { name: 'The Conjuring Universe',       pattern: /\b(Conjuring|Annabelle|Nun)\b/i },
  { name: 'Alien Franchise',              pattern: /\b(Alien|Prometheus)\b/i },
  { name: 'Evil Dead Series',             pattern: /\b(Evil Dead|Army of Darkness)\b/i },
  { name: 'A Nightmare on Elm Street',    pattern: /\bElm Street\b/i },
  { name: 'Friday the 13th',              pattern: /\bFriday the 13th\b/i },
  { name: 'Hellraiser Franchise',         pattern: /\bHellraiser\b/i },
  { name: 'Paranormal Activity Series',   pattern: /\bParanormal Activity\b/i },
  { name: 'Texas Chainsaw Massacre',      pattern: /\bTexas Chain\s?saw\b/i },
  { name: 'Final Destination Series',     pattern: /\bFinal Destination\b/i },
  { name: 'Insidious Series',             pattern: /\bInsidious\b/i },
  { name: 'Child\'s Play / Chucky',       pattern: /\b(Child's Play|Chucky)\b/i },
  { name: 'Predator Series',              pattern: /\b(Predator|Prey)\b/i },
  { name: 'A Quiet Place Franchise',      pattern: /\bQuiet Place\b/i },
];

export function getMovieFranchise(title: string): string | null {
  if (!title) return null;
  const match = FRANCHISES.find(f => f.pattern.test(title));
  return match ? match.name : null;
}

