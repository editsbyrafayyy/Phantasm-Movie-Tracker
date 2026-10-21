// Genre taxonomy for the /stream discovery feed.
// Restricted users see horror subgenres; unrestricted users see every genre.

// Horror sub-genre labels
export const GENRE_ITEMS = [
  'All',
  'Slasher',
  'Psychological',
  'Supernatural & Ghosts',
  'Occult & Demonic',
  'Folk Horror',
  'Creature Feature',
  'Zombie',
  'Vampire',
  'Found Footage',
  'Body Horror',
  'Gothic Horror',
  'Survival Horror',
  'Sci-Fi Horror',
  'Horror Comedy',
  'Gore & Extreme',
  'Haunted House',
  'Cult Classic',
];

export const ALL_GENRES_ITEMS = [
  'All',
  'Action',
  'Adventure',
  'Animation & Anime',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Thriller',
  'Slasher',
  'Psychological',
  'Supernatural & Ghosts',
  'Occult & Demonic',
  'Folk Horror',
  'Creature Feature',
  'Zombie',
  'Vampire',
  'Found Footage',
  'Body Horror',
  'Gothic Horror',
  'Survival Horror',
  'Sci-Fi Horror',
  'Horror Comedy',
  'Gore & Extreme',
  'Haunted House',
  'Cult Classic',
];

export interface GenreFilterConfig {
  genres?: string;
  keywords?: string;
  withoutGenres?: string;
}

export const GENRE_FILTER_MAP: Record<string, GenreFilterConfig> = {
  'Slasher': {
    genres: '27',
    keywords: '10339|12339|209714|9748|2626',
  },
  'Psychological': {
    genres: '27|53|9648',
    keywords: '10890|15001|9714|12554|214488|10787',
  },
  'Supernatural & Ghosts': {
    genres: '27',
    keywords: '5480|18035|10283|12552|156212|303334',
  },
  'Occult & Demonic': {
    genres: '27',
    keywords: '6158|2618|18035|303334|1523|10123|12552',
  },
  'Folk Horror': {
    genres: '27',
    keywords: '158718|1599|218579|6158|2618|180495',
  },
  'Creature Feature': {
    genres: '27',
    keywords: '1299|228809|1308|9951|173934|162086|10683',
  },
  'Zombie': {
    genres: '27',
    keywords: '12377|186565|10292|4458',
  },
  'Vampire': {
    genres: '27',
    keywords: '5613|3133',
  },
  'Found Footage': {
    genres: '27',
    keywords: '14301|209715|180497|180498',
  },
  'Body Horror': {
    genres: '27',
    keywords: '10654|180489|180491|180492',
  },
  'Gothic Horror': {
    genres: '27',
    keywords: '4344|180495|10283',
  },
  'Survival Horror': {
    genres: '27|53',
    keywords: '10683|10629|158713|156212|10787|10084',
  },
  'Sci-Fi Horror': {
    genres: '27,878',
    keywords: '9951|4565|180489|1612',
  },
  'Horror Comedy': {
    genres: '27,35',
  },
  'Gore & Extreme': {
    genres: '27',
    keywords: '180493|10654|9748|10714|2306',
  },
  'Haunted House': {
    genres: '27',
    keywords: '10283|12552|18035',
  },
  'Cult Classic': {
    genres: '27|53',
    keywords: '4379|9716|209714',
  },
};

export const ALL_GENRES_FILTER_MAP: Record<string, GenreFilterConfig> = {
  ...GENRE_FILTER_MAP,
  'Action': { genres: '28' },
  'Adventure': { genres: '12' },
  'Animation & Anime': { genres: '16' },
  'Comedy': { genres: '35' },
  'Crime': { genres: '80' },
  'Documentary': { genres: '99' },
  'Drama': { genres: '18' },
  'Fantasy': { genres: '14' },
  'Sci-Fi': { genres: '878' },
  'Romance': { genres: '10749' },
  'Thriller': { genres: '53' },
};

export const GENRE_DESCRIPTIONS: Record<string, string> = {
  'All': 'Popular horror and thriller titles, newest and most-watched first.',
  'Slasher': 'Masked killers, body counts and final girls.',
  'Psychological': 'Paranoia, unreliable narrators and minds coming apart.',
  'Supernatural & Ghosts': 'Hauntings, apparitions and poltergeists.',
  'Occult & Demonic': 'Cults, rituals, possessions and exorcisms.',
  'Folk Horror': 'Pagan rites and isolated rural communities.',
  'Creature Feature': 'Monsters, predators and things from elsewhere.',
  'Zombie': 'Outbreaks, the undead and what is left after.',
  'Vampire': 'Bloodsuckers, old and new.',
  'Found Footage': 'Recovered tapes, handheld POV and mockumentaries.',
  'Body Horror': 'Mutation, infection and decay.',
  'Gothic Horror': 'Old houses, family curses and period dread.',
  'Survival Horror': 'Traps, wilderness and staying alive.',
  'Sci-Fi Horror': 'Space, aliens and technology gone wrong.',
  'Horror Comedy': 'Horror played for laughs.',
  'Gore & Extreme': 'Splatter and shock. Not for everyone.',
  'Haunted House': 'Houses that do not want you there.',
  'Cult Classic': 'Midnight movies, grindhouse and B-movies.',
};

export const ALL_GENRE_DESCRIPTIONS: Record<string, string> = {
  ...GENRE_DESCRIPTIONS,
  'All': 'Popular films and series across every genre.',
  'Action': 'Stunts, fights and chases.',
  'Adventure': 'Quests, journeys and expeditions.',
  'Animation & Anime': 'Animated features and anime series.',
  'Comedy': 'Satire, rom-coms and slapstick.',
  'Crime': 'Heists, detectives and the underworld.',
  'Documentary': 'True stories, history and nature.',
  'Drama': 'Character-driven stories.',
  'Fantasy': 'Magic, myths and other worlds.',
  'Sci-Fi': 'Space, time travel and the future.',
  'Romance': 'Love stories.',
  'Thriller': 'Conspiracies, suspense and twists.',
};

export interface GenreConfig {
  items:        string[];
  filterMap:    Record<string, GenreFilterConfig>;
  descriptions: Record<string, string>;
}

const RESTRICTED: GenreConfig   = { items: GENRE_ITEMS, filterMap: GENRE_FILTER_MAP, descriptions: GENRE_DESCRIPTIONS };
const UNRESTRICTED: GenreConfig = { items: ALL_GENRES_ITEMS, filterMap: ALL_GENRES_FILTER_MAP, descriptions: ALL_GENRE_DESCRIPTIONS };

/** Stable (module-level) config object so hooks can depend on it safely. */
export function getGenreConfig(isUnrestricted: boolean): GenreConfig {
  return isUnrestricted ? UNRESTRICTED : RESTRICTED;
}
