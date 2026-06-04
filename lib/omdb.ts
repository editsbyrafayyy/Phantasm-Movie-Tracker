import type { OmdbSearchHit } from './types';

const BASE = 'https://www.omdbapi.com';
const KEY  = process.env.OMDB_API_KEY!;

// ── Raw OMDB shapes ───────────────────────────────────────────────────────────

interface OmdbSearchItem {
  imdbID: string;
  Title:  string;
  Year:   string;
  Poster: string;
}

interface OmdbMovieDetail {
  imdbID:     string;
  Title:      string;
  Year:       string;
  Director:   string;
  Runtime:    string;   // "112 min"
  Plot:       string;
  Poster:     string;
  imdbRating: string;
  Genre:      string;   // comma-separated
  Response:   string;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Search OMDB by title — returns up to 10 results.
 * Used by /api/omdb-search to power the autocomplete dropdown.
 */
export async function searchOmdb(query: string): Promise<OmdbSearchHit[]> {
  const url  = `${BASE}/?s=${encodeURIComponent(query)}&type=movie&apikey=${KEY}`;
  const res  = await fetch(url, { next: { revalidate: 300 } });
  const data = await res.json();

  if (!data.Search) return [];

  return (data.Search as OmdbSearchItem[]).slice(0, 8).map((r) => ({
    imdbID: r.imdbID,
    title:  r.Title,
    year:   r.Year,
    poster: r.Poster !== 'N/A' ? r.Poster : null,
  }));
}

/**
 * Fetch full movie detail by IMDB ID.
 * Returns a normalised object ready to upsert into the movies table,
 * or null if OMDB has no record for this ID.
 */
export async function fetchOmdbById(imdbId: string): Promise<{
  omdb_id:     string;
  title:       string;
  poster_url:  string | null;
  year:        number | null;
  director:    string | null;
  runtime_min: number | null;
  plot:        string | null;
  imdb_rating: number | null;
  genre_tags:  string[];
} | null> {
  const url  = `${BASE}/?i=${imdbId}&apikey=${KEY}`;
  const res  = await fetch(url, { next: { revalidate: 3600 } });
  const data = (await res.json()) as OmdbMovieDetail;

  if (data.Response !== 'True') return null;

  return {
    omdb_id:     data.imdbID,
    title:       data.Title,
    poster_url:  data.Poster !== 'N/A' ? data.Poster : null,
    year:        parseYear(data.Year),
    director:    data.Director !== 'N/A' ? data.Director : null,
    runtime_min: parseRuntime(data.Runtime),
    plot:        data.Plot !== 'N/A' ? data.Plot : null,
    imdb_rating: parseRating(data.imdbRating),
    genre_tags:  data.Genre !== 'N/A' ? data.Genre.split(', ') : [],
  };
}

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseRuntime(runtime: string): number | null {
  const match = runtime.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseRating(rating: string): number | null {
  const n = parseFloat(rating);
  return isNaN(n) ? null : n;
}

function parseYear(year: string): number | null {
  // Year may be a range "2023–" or a single "2023"
  const match = year.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}
