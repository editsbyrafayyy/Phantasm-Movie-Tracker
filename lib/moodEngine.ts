import { createServiceClient } from '@/lib/supabase/server';
import type { Entry, Movie } from '@/lib/types';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export interface MoodCandidate {
  source: 'vault' | 'tmdb';
  movieId: string;          // entry.id for vault, tmdb-{id} for TMDB
  tmdbId: number;           // TMDB ID
  imdbId: string;           // Guaranteed non-null IMDb ID (e.g. tt1234567)
  title: string;
  year: number | null;
  runtimeMin: number | null;
  tmdbRating: number | null;
  genreTags: string[];
  popularity: number | null;
  posterPath: string | null;
  overview: string | null;
  vaultScores?: {
    atmosphere: number;
    story: number;
    characters: number;
    pacing: number;
    visuals: number;
    thrill: number;
    sound: number;
    impact: number;
    total: number;
    recommend: string | null;
    subgenre: string;
    secondaryTag: string | null;
  };
}

export interface ScoredPair {
  imdbId: string;
  mood: string;
  score: number;
}

// Helper to extract TMDB relative poster path from absolute URL
function getRelativePosterPath(url: string | null): string | null {
  if (!url) return null;
  if (!url.startsWith('http')) return url;
  const match = url.match(/\/t\/p\/w\d+(.*)/);
  return match ? match[1] : url;
}

// ── Mood Scoring Formulas ────────────────────────────────────────────────────

function scoreTerrifyMe(c: MoodCandidate): number {
  if (c.source === 'vault') {
    const scores = c.vaultScores;
    if (!scores) return 0;
    const isRecommended = scores.recommend === 'Yes' || scores.recommend === 'Peak';
    const ratingGte7 = (c.tmdbRating ?? 0) >= 7.0;
    if (!isRecommended || !ratingGte7) return 0;

    // Thrill is 0-1, atmosphere is 0-2. Total max 3.
    const thrill = scores.thrill;
    const atmosphere = scores.atmosphere;
    return Math.round(((thrill + atmosphere) / 3.0) * 100);
  } else {
    // TMDB candidate
    const rating = c.tmdbRating ?? 0;
    if (rating < 7.0) return 0;
    return Math.round(rating * 10);
  }
}

function scoreMessWithMyHead(c: MoodCandidate): number {
  const queryWords = [
    'psychological', 'mind', 'twist', 'psychosis', 'hallucination',
    'occult', 'cult', 'paranormal', 'cerebral', 'dementia',
    'schizophrenia', 'delusion', 'insanity', 'memory loss', 'paranoia'
  ];

  if (c.source === 'vault') {
    const scores = c.vaultScores;
    if (!scores) return 0;
    const matchesSubgenre = 
      scores.subgenre === 'Psychological Horror' || 
      scores.subgenre === 'Religious/Occult Horror' ||
      scores.secondaryTag === 'Psychological Breakdown';

    if (!matchesSubgenre) return 0;

    const base = 70;
    const narrativeComplexity = ((scores.story + scores.characters) / 3.0) * 30;
    return Math.round(base + narrativeComplexity);
  } else {
    // TMDB candidate
    const text = ((c.title || '') + ' ' + (c.overview || '')).toLowerCase();
    const hasKeyword = queryWords.some(word => text.includes(word)) || c.genreTags.includes('Mystery');
    if (!hasKeyword) return 0;

    const base = 65;
    const ratingFactor = (c.tmdbRating ?? 0) * 3.5;
    return Math.round(Math.min(100, base + ratingFactor));
  }
}

function scoreQuickWatch(c: MoodCandidate): number {
  if (c.runtimeMin === null || c.runtimeMin > 95) return 0;
  return Math.round((c.tmdbRating ?? 0) * 10);
}

function scoreOldSchool(c: MoodCandidate): number {
  if (c.year === null || c.year > 1999) return 0;
  return Math.round((c.tmdbRating ?? 0) * 10);
}

function scoreFreshNightmare(c: MoodCandidate): number {
  const currentYear = new Date().getFullYear();
  if (c.year === null || c.year < currentYear - 2) return 0;
  return Math.round((c.tmdbRating ?? 0) * 10);
}

function scoreHiddenGem(c: MoodCandidate): number {
  const rating = c.tmdbRating ?? 0;
  if (rating < 6.5 || rating > 7.5) return 0;

  if (c.source === 'vault') {
    const scores = c.vaultScores;
    if (!scores) return 0;
    const isMainstream = 
      scores.subgenre === 'Slasher' || 
      scores.subgenre === 'Supernatural Horror' || 
      scores.subgenre === 'Zombie Horror';

    const base = isMainstream ? 50 : 75;
    const ratingBonus = (rating - 6.5) * 25;
    return Math.round(base + ratingBonus);
  } else {
    // TMDB candidate
    const pop = c.popularity ?? 0;
    let base = 20;
    if (pop < 50) {
      base = 75;
    } else if (pop < 150) {
      base = 50;
    }
    const ratingBonus = (rating - 6.5) * 25;
    return Math.round(base + ratingBonus);
  }
}

function scoreEveryoneWatching(c: MoodCandidate): number {
  const rating = c.tmdbRating ?? 0;
  if (rating < 7.5) return 0;

  if (c.source === 'vault') {
    const scores = c.vaultScores;
    if (!scores) return 0;
    const isMainstream = 
      scores.subgenre === 'Slasher' || 
      scores.subgenre === 'Supernatural Horror' || 
      scores.subgenre === 'Zombie Horror';

    const base = isMainstream ? 80 : 60;
    const ratingBonus = (rating - 7.5) * 8;
    return Math.round(base + ratingBonus);
  } else {
    // TMDB candidate
    const pop = c.popularity ?? 0;
    let base = 20;
    if (pop >= 150) {
      base = 80;
    } else {
      base = (pop / 150) * 60 + 20;
    }
    const ratingBonus = (rating - 7.5) * 8;
    return Math.round(base + ratingBonus);
  }
}

function scoreStomachOfSteel(c: MoodCandidate): number {
  if (c.source === 'vault') {
    const scores = c.vaultScores;
    if (!scores) return 0;
    const isGore = 
      scores.subgenre === 'Gore/Extreme Horror' || 
      scores.secondaryTag === 'Body Horror';

    return isGore ? 100 : 0;
  } else {
    // TMDB candidate
    const text = ((c.title || '') + ' ' + (c.overview || '')).toLowerCase();
    const goreWords = [
      'gore', 'gory', 'splatter', 'mutilation', 'body horror', 'flesh',
      'visceral', 'cannibal', 'disfigure', 'decapitate', 'severed', 'torture'
    ];
    const hasGore = goreWords.some(word => text.includes(word));
    if (!hasGore) return 0;

    const rating = c.tmdbRating ?? 0;
    return Math.round(70 + rating * 3);
  }
}

const MOOD_SCORERS: Record<string, (c: MoodCandidate) => number> = {
  terrifying: scoreTerrifyMe,
  psychological: scoreMessWithMyHead,
  quick: scoreQuickWatch,
  classic: scoreOldSchool,
  recent: scoreFreshNightmare,
  hidden: scoreHiddenGem,
  popular: scoreEveryoneWatching,
  extreme: scoreStomachOfSteel,
};

// ── Global Greedy Assignment ──────────────────────────────────────────────────

export function assignMoviesToMoods(
  matrix: Map<string, Map<string, number>>, // imdbId -> mood -> score
  targetPerMood: number = 12
): Map<string, string[]> {
  const pairs: ScoredPair[] = [];
  for (const [imdbId, moodScores] of matrix) {
    for (const [mood, score] of moodScores) {
      if (score > 0) {
        pairs.push({ imdbId, mood, score });
      }
    }
  }

  // Sort by score descending (highest confidence wins first)
  pairs.sort((a, b) => b.score - a.score);

  const assigned = new Set<string>();
  const result = new Map<string, string[]>();

  for (const { imdbId, mood } of pairs) {
    if (assigned.has(imdbId)) continue;
    const current = result.get(mood) ?? [];
    if (current.length >= targetPerMood) continue;

    current.push(imdbId);
    result.set(mood, current);
    assigned.add(imdbId);
  }

  return result;
}

// ── Cache Refresh Handler ─────────────────────────────────────────────────────

export async function refreshMoodCache(): Promise<{ success: boolean; stats: any }> {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured');
  }

  const log: string[] = [];
  let tmdbCallCount = 0;

  function logCall(endpoint: string) {
    tmdbCallCount++;
    log.push(`[TMDB Call #${tmdbCallCount}] ${endpoint}`);
    console.log(`[TMDB Call #${tmdbCallCount}] ${endpoint}`);
  }

  const serviceClient = createServiceClient();

  // 1. Fetch DB Lookup Maps
  console.log('[Mood Engine] Fetching movies from database...');
  const { data: dbMovies, error: dbMoviesError } = await serviceClient
    .from('movies')
    .select('*');

  if (dbMoviesError) {
    throw new Error(`Failed to query movies from DB: ${dbMoviesError.message}`);
  }

  const movieByTmdbId = new Map<number, Movie>();
  const movieByImdbId = new Map<string, Movie>();
  if (dbMovies) {
    for (const m of dbMovies) {
      if (m.tmdb_id) movieByTmdbId.set(m.tmdb_id, m);
      if (m.omdb_id) movieByImdbId.set(m.omdb_id, m);
    }
  }

  // 2. Fetch Vault Entries
  console.log('[Mood Engine] Fetching vault entries...');
  const OWNER_ID = process.env.OWNER_USER_ID || '';
  const { data: vaultEntries, error: vaultError } = await serviceClient
    .from('entries')
    .select('*, movie:movies(*)')
    .eq('user_id', OWNER_ID);

  if (vaultError) {
    throw new Error(`Failed to query owner entries: ${vaultError.message}`);
  }

  const candidates = new Map<string, MoodCandidate>(); // key: imdbId

  // Add Vault candidates
  if (vaultEntries) {
    for (const entry of vaultEntries) {
      const movie = entry.movie;
      if (!movie) continue;
      const imdbId = movie.omdb_id;
      if (!imdbId) continue; // Must be streamable

      const candidate: MoodCandidate = {
        source: 'vault',
        movieId: entry.id,
        tmdbId: movie.tmdb_id || 0,
        imdbId,
        title: movie.title,
        year: movie.year,
        runtimeMin: movie.runtime_min,
        tmdbRating: movie.imdb_rating ? Number(movie.imdb_rating) : null,
        genreTags: movie.genre_tags || [],
        popularity: null,
        posterPath: movie.poster_url,
        overview: movie.plot,
        vaultScores: {
          atmosphere: Number(entry.atmosphere || 0),
          story: Number(entry.story || 0),
          characters: Number(entry.characters || 0),
          pacing: Number(entry.pacing || 0),
          visuals: Number(entry.visuals || 0),
          thrill: Number(entry.thrill || 0),
          sound: Number(entry.sound || 0),
          impact: Number(entry.impact || 0),
          total: Number(entry.total || 0),
          recommend: entry.recommend,
          subgenre: entry.subgenre,
          secondaryTag: entry.secondary_tag,
        }
      };

      // Resolve tmdbId if missing
      if (!candidate.tmdbId) {
        logCall(`/find/${imdbId}`);
        try {
          const res = await fetch(`${TMDB_BASE}/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`);
          if (res.ok) {
            const data = await res.json();
            const movieRes = data.movie_results?.[0];
            if (movieRes) {
              candidate.tmdbId = movieRes.id;
              // update DB
              await serviceClient.from('movies').update({ tmdb_id: movieRes.id }).eq('id', movie.id);
            }
          }
        } catch (err) {
          console.error(`Failed to resolve TMDB ID for vault movie ${movie.title}:`, err);
        }
      }

      candidates.set(imdbId, candidate);
    }
  }

  console.log(`[Mood Engine] Loaded ${candidates.size} candidates from Vault.`);

  // 3. TMDB Discovery (Max 5 pages combined)
  console.log('[Mood Engine] Initiating TMDB Horror Discovery...');
  const discoverParamsList = [
    { sort_by: 'popularity.desc', page: '1' },
    { sort_by: 'popularity.desc', page: '2' },
    { sort_by: 'vote_average.desc', 'vote_count.gte': '200', page: '1' },
    { sort_by: 'vote_average.desc', 'vote_count.gte': '100', page: '2' },
    { sort_by: 'primary_release_date.desc', 'vote_average.gte': '5.0', page: '1' }
  ];

  const tmdbMovies: any[] = [];
  const seenTmdbIds = new Set<number>();

  for (const params of discoverParamsList) {
    const url = new URL(`${TMDB_BASE}/discover/movie`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    url.searchParams.set('with_genres', '27'); // Horror
    url.searchParams.set('include_adult', 'false');
    
    // Exclude unreleased films
    const today = new Date().toISOString().split('T')[0];
    url.searchParams.set('primary_release_date.lte', today);

    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    logCall(`/discover/movie?${url.searchParams.toString()}`);
    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`TMDB discover failed with status ${res.status}`);
      }
      const data = await res.json();
      const results = data.results ?? [];
      for (const m of results) {
        if (!m.poster_path) continue; // Must have poster
        if (!seenTmdbIds.has(m.id)) {
          seenTmdbIds.add(m.id);
          tmdbMovies.push(m);
        }
      }
    } catch (err) {
      console.error('Discover error:', err);
    }
  }

  console.log(`[Mood Engine] Discovered ${tmdbMovies.length} unique TMDB movies.`);

  // 4. Resolve IMDb IDs and load metadata for TMDB candidates
  // Hard cap of 100 external lookup operations
  let lookupsCount = 0;
  const lookupLimit = 100;

  for (const m of tmdbMovies) {
    const tmdbId = m.id;

    // Check if we already have it in candidate list (via Vault deduplication)
    const existingDbMovie = movieByTmdbId.get(tmdbId);
    let imdbId = existingDbMovie?.omdb_id ?? null;
    let runtime = existingDbMovie?.runtime_min ?? null;

    if (existingDbMovie && imdbId) {
      // Already in DB and has IMDb ID
      if (candidates.has(imdbId)) {
        // Already processed as a vault movie
        continue;
      }
      // Add as TMDB candidate using cached database info
      const candidate: MoodCandidate = {
        source: 'tmdb',
        movieId: `tmdb-${tmdbId}`,
        tmdbId,
        imdbId,
        title: existingDbMovie.title,
        year: existingDbMovie.year,
        runtimeMin: runtime,
        tmdbRating: existingDbMovie.imdb_rating ? Number(existingDbMovie.imdb_rating) : m.vote_average,
        genreTags: existingDbMovie.genre_tags || [],
        popularity: m.popularity,
        posterPath: existingDbMovie.poster_url,
        overview: existingDbMovie.plot
      };
      candidates.set(imdbId, candidate);
      continue;
    }

    // Not in DB with IMDb ID, we need to call TMDB to get details & external ids
    if (lookupsCount >= lookupLimit) {
      console.log(`[Mood Engine] Reached lookups limit of ${lookupLimit}. Skipping remaining TMDB candidates.`);
      break;
    }

    lookupsCount++;
    logCall(`/movie/${tmdbId}?append_to_response=external_ids`);
    try {
      const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`);
      if (!res.ok) {
        console.warn(`Failed to fetch details for tmdb-${tmdbId}`);
        continue;
      }
      const detail = await res.json();
      imdbId = detail.external_ids?.imdb_id ?? null;

      if (!imdbId) {
        console.log(`[Mood Engine] Skipping tmdb-${tmdbId} (no IMDb ID).`);
        continue;
      }

      // Check for vault deduplication (in case IMDb ID matches a vault entry)
      if (candidates.has(imdbId)) {
        continue;
      }

      runtime = detail.runtime || null;
      const genreNames = detail.genres ? detail.genres.map((g: any) => g.name) : [];
      const title = detail.title || m.title;

      const posterUrl = detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null;
      const backdropUrl = detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null;
      const releaseYear = detail.release_date ? parseInt(detail.release_date.slice(0, 4)) : null;

      // Upsert into movies table
      const moviePayload = {
        title,
        omdb_id: imdbId,
        tmdb_id: tmdbId,
        poster_url: posterUrl,
        backdrop_url: backdropUrl,
        year: releaseYear,
        plot: detail.overview || null,
        imdb_rating: detail.vote_average || null,
        genre_tags: genreNames,
        runtime_min: runtime,
        media_type: 'movie',
      };

      if (existingDbMovie) {
        // Update
        await serviceClient.from('movies').update(moviePayload).eq('id', existingDbMovie.id);
      } else {
        // Insert
        await serviceClient.from('movies').insert(moviePayload);
      }

      const candidate: MoodCandidate = {
        source: 'tmdb',
        movieId: `tmdb-${tmdbId}`,
        tmdbId,
        imdbId,
        title,
        year: releaseYear,
        runtimeMin: runtime,
        tmdbRating: detail.vote_average || null,
        genreTags: genreNames,
        popularity: detail.popularity || m.popularity,
        posterPath: posterUrl,
        overview: detail.overview
      };
      candidates.set(imdbId, candidate);

    } catch (err) {
      console.error(`Error resolving details for tmdb-${tmdbId}:`, err);
    }
  }

  console.log(`[Mood Engine] Total candidates pool size: ${candidates.size}`);

  // 5. Compute Scoring Matrix
  const matrix = new Map<string, Map<string, number>>(); // imdbId -> mood -> score
  for (const [imdbId, candidate] of candidates) {
    const moodScores = new Map<string, number>();
    for (const [mood, scorer] of Object.entries(MOOD_SCORERS)) {
      let score = scorer(candidate);
      if (score > 0) {
        // Apply tiebreaker: Vault gets +2 bonus
        if (candidate.source === 'vault') {
          score = Math.min(100, score + 2);
        }
        moodScores.set(mood, score);
      }
    }
    if (moodScores.size > 0) {
      matrix.set(imdbId, moodScores);
    }
  }

  // 6. Run Greedy Assignment
  const assignments = assignMoviesToMoods(matrix, 12);

  // 7. Persist to mood_cache
  const moodsList = Object.keys(MOOD_SCORERS);
  const cacheStats: any = {};

  for (const mood of moodsList) {
    const assignedImdbIds = assignments.get(mood) ?? [];
    const payload = assignedImdbIds.map(imdbId => {
      const c = candidates.get(imdbId)!;
      return {
        id: c.tmdbId, // Render component expects numeric TMDB ID
        title: c.title,
        poster_path: c.posterPath,
        vote_average: c.tmdbRating || 0,
        release_date: c.year ? `${c.year}-01-01` : '',
        source: c.source
      };
    });

    console.log(`[Mood Engine] Saving Cache for mood '${mood}' with ${payload.length} movies.`);
    cacheStats[mood] = payload.length;

    // Upsert database row
    const { error: cacheError } = await serviceClient
      .from('mood_cache')
      .upsert({
        mood,
        payload,
        computed_at: new Date().toISOString()
      }, { onConflict: 'mood' });

    if (cacheError) {
      console.error(`Failed to upsert cache for mood ${mood}:`, cacheError.message);
    }
  }

  return {
    success: true,
    stats: {
      totalCandidates: candidates.size,
      lookupsPerformed: lookupsCount,
      tmdbCallCount,
      tmdbCalls: log,
      moodCounts: cacheStats
    }
  };
}
