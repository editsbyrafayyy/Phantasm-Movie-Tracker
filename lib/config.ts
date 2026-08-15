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
  return Math.round((sum + fields.bonus) * 100) / 100;
}

// ── Built-in Horror Franchises ────────────────────────────────────────────────
export interface FranchiseConfig {
  name: string;
  pattern: RegExp;
  exclude?: RegExp;
  total: number;
}

export const FRANCHISES_REGISTRY: FranchiseConfig[] = [
  // ── Slasher & Mainstream Classics ──────────────────────────────────────────
  {
    name: 'A Nightmare on Elm Street',
    pattern: /\b(?:(?:A\s+)?Nightmare on Elm Street|Freddy['’]?s Dead(?:\s*:\s*The Final Nightmare)?|(?:Wes Craven['’]?s\s+)?New Nightmare|Freddy vs\.?\s*Jason)\b/i,
    total: 9,
  },
  {
    name: 'Friday the 13th',
    pattern: /\b(?:Friday the 13th|Jason Goes to Hell(?:\s*:\s*The Final Friday)?|Jason X|Freddy vs\.?\s*Jason)\b/i,
    total: 12,
  },
  {
    name: 'Halloween Franchise',
    pattern: /(?:^|\b)(?:Halloween(?:\s+(?:[0-9IVX]+|H20|Kills|Ends|The Curse of|Resurrection|Season of the Witch)|:\s*.*)?|H20:\s*20 Years Later)\b/i,
    exclude: /\bTales of Halloween\b/i,
    total: 13,
  },
  {
    name: 'Texas Chainsaw Massacre',
    pattern: /\b(?:Texas\s+Chain\s*saw(?:\s*Massacre|\s*3D)?|Leatherface(?:\s*:\s*Texas Chainsaw Massacre III)?)\b/i,
    total: 9,
  },
  {
    name: 'Scream Collection',
    pattern: /\b(?:Scream(?:\s*(?:[2-7]|VI|IV))?|Scre4m)\b/i,
    exclude: /\b(?:Scream Blacula Scream|Scream and Scream Again)\b/i,
    total: 6,
  },
  {
    name: 'Child\'s Play / Chucky',
    pattern: /\b(?:Child['’]?s\s+Play|(?:Bride|Seed|Curse|Cult)\s+of\s+Chucky|Chucky)\b/i,
    total: 8,
  },
  {
    name: 'Saw Franchise',
    pattern: /(?:^|\b)(?:Saw(?:\s+(?:[0-9IVX]+|3D|The Final Chapter|Rebirth)|:)|Saw$|Jigsaw$|Jigsaw:\s*|Spiral:\s*From the Book of Saw)/i,
    exclude: /\b(?:I Saw the|The Man Who Saw|Chain Saw)\b/i,
    total: 10,
  },
  {
    name: 'Hellraiser Franchise',
    pattern: /\bHell\s?raiser\b/i,
    total: 11,
  },
  {
    name: 'Candyman Franchise',
    pattern: /\bCandyman\b/i,
    total: 4,
  },
  {
    name: 'Phantasm Series',
    pattern: /(?:^|\b)Phantasm(?:\s+(?:II|III|IV|V|\d+|Lord of the Dead|Oblivion|Ravager))?(?::\s*.*)?$/i,
    total: 5,
  },

  // ── Sci-Fi / Monster Horror ────────────────────────────────────────────────
  {
    name: 'Alien Franchise',
    pattern: /\b(?:Alien[s³]?(?:\s*(?:[0-9IVX]+|Resurrection|Covenant|Romulus))?|Prometheus|Alien\s*vs\.?\s*Predator|Aliens\s*vs\.?\s*Predator|AVP)\b/i,
    exclude: /\b(?:Cowboys & Aliens|Monsters vs\.? Aliens|My Stepmother Is an Alien|Alien Abduction|Alien Raiders|Alien Nation)\b/i,
    total: 9,
  },
  {
    name: 'Predator Series',
    pattern: /(?:^|\b)(?:The\s+)?Predator[s]?(?:\s+[0-9IVX]+)?\b|^(?:The\s+)?Prey(?:\s*\(2022\))?$|\bAlien\s*vs\.?\s*Predator\b/i,
    exclude: /\b(?:Birds of Prey|The Strangers:\s*Prey at Night)\b/i,
    total: 7,
  },
  {
    name: 'Tremors Franchise',
    pattern: /\bTremors\b/i,
    total: 7,
  },
  {
    name: 'Critters Series',
    pattern: /\bCritters\b/i,
    total: 5,
  },
  {
    name: 'The Fly Series',
    pattern: /(?:^|\b)(?:The\s+Fly(?:\s+(?:II|2))?|Return of the Fly|Curse of the Fly)\b/i,
    total: 5,
  },
  {
    name: 'Piranha Series',
    pattern: /\bPiranha(?:\s+(?:II|2|3D|3DD|:\s*The Spawning))?\b/i,
    total: 4,
  },

  // ── Supernatural & Paranormal Universes ────────────────────────────────────
  {
    name: 'The Conjuring Universe',
    pattern: /\b(?:(?:The\s+)?Conjuring|Annabelle(?:\s*:\s*Creation|\s+Comes\s+Home)?|The\s+Nun(?:\s+(?:II|2))?|The\s+Curse\s+of\s+(?:La\s+Llorona|the\s+Weeping\s+Woman))\b/i,
    total: 9,
  },
  {
    name: 'Insidious Series',
    pattern: /\bInsidious\b/i,
    total: 5,
  },
  {
    name: 'Paranormal Activity Series',
    pattern: /\bParanormal Activity\b/i,
    total: 7,
  },
  {
    name: 'The Exorcist Franchise',
    pattern: /(?:^|\b)(?:The\s+)?Exorcist(?:\s+(?:II|III|IV|V|\d+|The Beginning|Believer|Deceiver))?(?::\s*.*)?$|\bDominion:\s*Prequel to the Exorcist\b/i,
    exclude: /\b(?:The Pope['’]?s Exorcist|The Last Exorcism|The Exorcism of Emily Rose|^The Exorcism$)\b/i,
    total: 6,
  },
  {
    name: 'Poltergeist Franchise',
    pattern: /\bPoltergeist\b/i,
    total: 4,
  },
  {
    name: 'The Omen Franchise',
    pattern: /\b(?:(?:The\s+)?(?:First\s+)?Omen(?:\s+(?:II|III|IV|\d+))?|Damien:\s*Omen\s*II)\b/i,
    total: 6,
  },
  {
    name: 'The Amityville Horror',
    pattern: /\bAmityville\b/i,
    total: 10,
  },
  {
    name: 'The Ring / Ringu',
    pattern: /(?:^|\b)(?:The\s+Ring(?:\s+(?:Two|2))?|Rings|Ringu(?:\s+[02])?|Sadako(?:\s+3D|\s+vs\.?\s*Kayako)?)\b/i,
    exclude: /\b(?:The Lord of the Rings|Ring of Fire|The Bling Ring)\b/i,
    total: 3,
  },
  {
    name: 'The Grudge / Ju-On',
    pattern: /\b(?:(?:The\s+)?Grudge(?:\s+[23])?|Ju-?On(?::\s*The Grudge)?|Sadako\s+vs\.?\s*Kayako)\b/i,
    total: 4,
  },

  // ── Modern Hit Franchises ──────────────────────────────────────────────────
  {
    name: 'Terrifier Franchise',
    pattern: /\b(?:Terrifier(?:\s+[23])?|All Hallows['’]?\s*Eve)\b/i,
    total: 3,
  },
  {
    name: 'A Quiet Place Franchise',
    pattern: /\b(?:A\s+)?Quiet Place\b/i,
    total: 3,
  },
  {
    name: 'The Purge Franchise',
    pattern: /\b(?:The\s+)?(?:First\s+|Forever\s+)?Purge\b/i,
    total: 5,
  },
  {
    name: 'Final Destination Series',
    pattern: /\b(?:The\s+)?Final Destination\b/i,
    total: 5,
  },
  {
    name: 'V/H/S Franchise',
    pattern: /\bV\/?H\/?S(?:\/?[0-9]+|:?\s*Viral|:?\s*Beyond)?\b/i,
    total: 7,
  },
  {
    name: 'Smile Series',
    pattern: /(?:^|\b)Smile(?:\s+2|\s+Part\s+II)?$/i,
    exclude: /\bMona Lisa Smile\b/i,
    total: 2,
  },
  {
    name: 'The Strangers Franchise',
    pattern: /\bThe Strangers(?:\s*:\s*(?:Prey at Night|Chapter\s*\d+))?\b/i,
    total: 3,
  },
  {
    name: 'Sinister Series',
    pattern: /(?:^|\b)Sinister(?:\s+2)?$/i,
    total: 2,
  },
  {
    name: 'Happy Death Day Series',
    pattern: /\bHappy Death Day(?:\s*2U)?\b/i,
    total: 2,
  },
  {
    name: 'Don\'t Breathe Series',
    pattern: /\bDon['’]?t Breathe(?:\s+2)?\b/i,
    total: 2,
  },
  {
    name: 'Cloverfield Franchise',
    pattern: /\b(?:10\s+)?Cloverfield(?:\s+Lane|\s+Paradox)?\b/i,
    total: 3,
  },

  // ── Cult, Zombie & Indie Trilogies ─────────────────────────────────────────
  {
    name: 'Evil Dead Series',
    pattern: /\b(?:(?:The\s+)?Evil Dead(?:\s+(?:II|2|Rise))?|Army of Darkness)\b/i,
    total: 5,
  },
  {
    name: 'George A. Romero\'s Dead Series',
    pattern: /\b(?:Night|Dawn|Day|Land|Diary|Survival)\s+of\s+the\s+Dead\b/i,
    total: 6,
  },
  {
    name: 'Return of the Living Dead',
    pattern: /\b(?:The\s+)?Return of the Living Dead\b/i,
    total: 5,
  },
  {
    name: '28 Days Later Series',
    pattern: /\b28\s+(?:Days|Weeks|Years)\s+Later\b/i,
    total: 2,
  },
  {
    name: 'Re-Animator Trilogy',
    pattern: /\b(?:(?:Bride|Beyond)\s+of\s+)?Re-?Animator\b/i,
    total: 3,
  },
  {
    name: 'Ti West\'s X Trilogy',
    pattern: /(?:^X$|^(?:The\s+)?X\s*\(2022\)|\bPearl\b|\bMaXXXine\b)/i,
    total: 3,
  },
  {
    name: 'Rob Zombie\'s Firefly Trilogy',
    pattern: /\b(?:House of (?:1000|1,000|a Thousand) Corpses|The Devil['’]?s Rejects|3 from Hell|Three from Hell)\b/i,
    total: 3,
  },
  {
    name: 'Hostel Trilogy',
    pattern: /(?:^|\b)Hostel(?:\s*:\s*Part\s+(?:II|III|2|3)|\s+[23])?$/i,
    total: 3,
  },
  {
    name: 'Wrong Turn Franchise',
    pattern: /\bWrong Turn\b/i,
    total: 7,
  },
  {
    name: 'Jeepers Creepers Series',
    pattern: /\bJeepers Creepers\b/i,
    total: 4,
  },
  {
    name: 'The Blair Witch Project',
    pattern: /\b(?:The\s+)?Blair Witch(?:\s+Project)?\b/i,
    total: 3,
  },
  {
    name: '[REC] Franchise',
    pattern: /\[?REC\]?(?:\s*(?:2|3|4|Genesis|Apocalypse|:))?/i,
    total: 4,
  },
  {
    name: 'Cube Trilogy',
    pattern: /(?:^|\b)Cube(?:\s*(?:2|Zero|Hypercube|:\s*Hypercube))?$|\bCube\s*2:\s*Hypercube\b/i,
    total: 3,
  },
  {
    name: 'I Know What You Did Last Summer',
    pattern: /\bI\s+(?:Still\s+|'ll\s+Always\s+)?Know\s+What\s+You\s+Did\s+Last\s+Summer\b/i,
    total: 3,
  },
  {
    name: 'The Hills Have Eyes',
    pattern: /\bThe Hills Have Eyes(?:\s*(?:Part\s+)?(?:II|2))?\b/i,
    total: 4,
  },
  {
    name: 'Hatchet Series',
    pattern: /\b(?:Hatchet(?:\s+(?:II|III|2|3))?|Victor Crowley)\b/i,
    total: 4,
  },
  {
    name: 'Leprechaun Franchise',
    pattern: /\bLeprechaun\b/i,
    total: 8,
  },
  {
    name: 'Sleepaway Camp Series',
    pattern: /\b(?:Return to\s+)?Sleepaway Camp(?:\s*(?:II|III|2|3))?\b/i,
    total: 4,
  },
  {
    name: 'Ginger Snaps Trilogy',
    pattern: /\bGinger Snaps\b/i,
    total: 3,
  },
  {
    name: 'Psycho Franchise',
    pattern: /(?:^|\b)Psycho(?:\s+(?:II|III|IV|2|3|4|The Beginning))?(?::\s*.*)?$/i,
    exclude: /\bAmerican Psycho\b/i,
    total: 5,
  },
  {
    name: 'Hannibal Lecter Series',
    pattern: /\b(?:Manhunter|Silence of the Lambs|Hannibal|Red Dragon|Hannibal Rising)\b/i,
    total: 5,
  },
  {
    name: 'Blade Trilogy',
    pattern: /(?:^|\b)Blade(?:\s*(?:II|2|Trinity|:\s*Trinity))?$|^Blade$/i,
    exclude: /\bBlade Runner\b/i,
    total: 3,
  },
  {
    name: 'Resident Evil Franchise',
    pattern: /\bResident Evil\b/i,
    total: 7,
  },
  {
    name: 'Underworld Franchise',
    pattern: /\bUnderworld(?:\s*:\s*(?:Evolution|Rise of the Lycans|Awakening|Blood Wars)|\s+Evolution|\s+Awakening)?\b/i,
    total: 5,
  },
];

// Backwards-compatible export mapping
export const FRANCHISES: { name: string; pattern: RegExp }[] = FRANCHISES_REGISTRY.map(f => ({
  name: f.name,
  pattern: f.pattern,
}));

export const FRANCHISE_TOTALS: Record<string, number> = FRANCHISES_REGISTRY.reduce((acc, f) => {
  acc[f.name] = f.total;
  return acc;
}, {} as Record<string, number>);

/**
 * Normalizes title for robust matching (strips release year suffixes, trims, standardizes apostrophes).
 */
function normalizeTitle(rawTitle: string): string {
  return rawTitle
    .replace(/[\u2018\u2019]/g, "'") // Normalize smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Normalize smart double quotes
    .replace(/\s*\(\d{4}\)$/, '')    // Strip trailing (YYYY)
    .trim();
}

/**
 * Returns the primary matching franchise for a movie title, or null.
 */
export function getMovieFranchise(title: string): string | null {
  if (!title) return null;
  const clean = normalizeTitle(title);

  for (const franchise of FRANCHISES_REGISTRY) {
    if (franchise.exclude && franchise.exclude.test(clean)) {
      continue;
    }
    if (franchise.pattern.test(clean) || franchise.pattern.test(title)) {
      return franchise.name;
    }
  }

  return null;
}

/**
 * Returns all matching franchises (useful for crossovers such as Freddy vs. Jason).
 */
export function getMovieFranchises(title: string): string[] {
  if (!title) return [];
  const clean = normalizeTitle(title);
  const matched: string[] = [];

  for (const franchise of FRANCHISES_REGISTRY) {
    if (franchise.exclude && franchise.exclude.test(clean)) {
      continue;
    }
    if (franchise.pattern.test(clean) || franchise.pattern.test(title)) {
      matched.push(franchise.name);
    }
  }

  return matched;
}


