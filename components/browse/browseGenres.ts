// Genre taxonomy for the Browse / Stream discovery feed.
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
  'All': 'Explore the deepest corners of the horror catalog, from modern acclaimed blockbusters to underground cult gems.',
  'Slasher': 'Masked killers, sharp blades, rising body counts, and classic final girl confrontations.',
  'Psychological': 'Mind games, fractured realities, overwhelming paranoia, and psychological dread.',
  'Supernatural & Ghosts': 'Haunted spirits, eerie apparitions, poltergeists, and otherworldly spectral dread.',
  'Occult & Demonic': 'Sinister cults, dark rituals, demonic possessions, exorcisms, and ancient evil.',
  'Folk Horror': 'Pagan rituals, ancient folklore, and insidious terror rooted in isolated rural communities.',
  'Creature Feature': 'Monstrous beasts, giant predators, biological anomalies, and extraterrestrial horrors.',
  'Zombie': 'Viral outbreaks, flesh-eating undead swarms, and harrowing post-apocalyptic survival.',
  'Vampire': 'Gothic bloodsuckers, immortal aristocratic predators, and nocturnal dread.',
  'Found Footage': 'Recovered camcorder tapes, handheld POV immersion, and terrifying mockumentaries.',
  'Body Horror': 'Grotesque physical mutations, biological decay, visceral infections, and bodily terror.',
  'Gothic Horror': 'Victorian dread, crumbling ancestral castles, gloomy atmosphere, and dark romance.',
  'Survival Horror': 'Claustrophobic death traps, wilderness isolation, and the desperate instinct to stay alive.',
  'Sci-Fi Horror': 'Deep space isolation, lethal xenomorphs, and chilling technological nightmares.',
  'Horror Comedy': 'Campy bloodshed, pitch-black humor, and hilarious macabre chaos.',
  'Gore & Extreme': 'Uncompromising violence, intense visceral splatter, and relentless shock horror.',
  'Haunted House': 'Creaking floorboards, malevolent dwellings, and sinister domestic spaces.',
  'Cult Classic': 'Midnight movie favorites, grindhouse gems, and enduring B-movie masterpieces.',
};

export const ALL_GENRE_DESCRIPTIONS: Record<string, string> = {
  ...GENRE_DESCRIPTIONS,
  'All': 'Explore the complete world cinema and television catalog across every genre, studio, and decade.',
  'Action': 'High-octane adrenaline, explosive stunts, martial arts spectacles, and heroic battles.',
  'Adventure': 'Epic journeys, daring quests, uncharted wilderness, and breathtaking expeditions.',
  'Animation & Anime': 'Stunning animated features, Japanese anime series, visual masterpieces, and imaginative worlds.',
  'Comedy': 'Laugh-out-loud humor, witty satires, romantic comedies, and classic slapstick.',
  'Crime': 'Gritty underworld sagas, heist masterminds, detectives, and suspenseful police procedurals.',
  'Documentary': 'Real-world exposés, historical deep dives, human stories, and nature chronicles.',
  'Drama': 'Emotionally powerful narratives, complex characters, acclaimed prestige cinema, and heartfelt stories.',
  'Fantasy': 'Mythical realms, magic spells, legendary creatures, and enchanting epics.',
  'Sci-Fi': 'Futuristic visions, deep space odyssey, AI dilemmas, time travel, and mind-bending concepts.',
  'Romance': 'Passionate love stories, timeless romantic dramas, emotional connections, and heartwarming journeys.',
  'Thriller': 'Edge-of-your-seat tension, gripping conspiracies, nail-biting suspense, and unexpected twists.',
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
