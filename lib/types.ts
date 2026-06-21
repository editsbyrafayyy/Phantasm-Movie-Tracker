import type { Recommend } from './config';

// ── Movie (shared metadata, sourced from OMDb + TMDB) ─────────────────────────
export interface Movie {
  id:           string;
  title:        string;
  omdb_id:      string | null;
  tmdb_id:      number | null;       // TMDB ID for backdrop + cast
  poster_url:   string | null;       // Portrait poster (OMDb preferred, TMDB fallback)
  backdrop_url: string | null;       // Landscape backdrop from TMDB (used for hero banners)
  year:         number | null;
  director:     string | null;
  runtime_min:  number | null;
  plot:         string | null;
  imdb_rating:  number | null;
  genre_tags:   string[] | null;
  cast_list:    { name: string; character?: string | null; profile_path: string | null }[] | null;
  media_type:   'movie' | 'tv' | null;  // Determines streaming embed URL pattern
  created_at:   string;
}

// ── Entry (per-user rating) ───────────────────────────────────────────────────
export interface Entry {
  id:            string;
  user_id:       string;
  movie_id:      string;
  subgenre:      string;
  secondary_tag: string | null;
  recommend:     Recommend | null;
  atmosphere:    number | null;
  story:         number | null;
  characters:    number | null;
  pacing:        number | null;
  visuals:       number | null;
  thrill:        number | null;
  sound:         number | null;
  impact:        number | null;
  bonus:         0 | 1;
  total:         number | null;
  must_watch?: boolean;
  notes?:        string | null;
  created_at:    string;
  updated_at:    string;
  movie:         Movie;              // joined from movies table
}

// ── Form data (Add / Update forms) ───────────────────────────────────────────
export interface MovieFormData {
  title:        string;
  omdbId:       string;             // IMDB ID if selected from OMDB autocomplete; '' if manual
  subgenre:     string;
  secondaryTag: string;
  recommend:    Recommend;
  atmosphere:   number | '';
  story:        number | '';
  characters:   number | '';
  pacing:       number | '';
  visuals:      number | '';
  thrill:       number | '';
  sound:        number | '';
  impact:       number | '';
  bonus:        0 | 1;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export interface StatsData {
  totalFilms:          number;
  averageTotal:        number;
  highestScore:        number;
  mostCommonSubgenre:  string;
  bySubgenre:          { subgenre: string; count: number; pct: number }[];
  byRecommend:         { recommend: string; count: number; pct: number }[];
  scoresByField:       { field: string; values: number[] }[];
  topRated:            { id: string; title: string; poster: string | null; total: number }[];
  scoreDistribution:   number[];
  releaseDecades:      { decade: string; count: number; pct: number }[];
}

// ── Profile ───────────────────────────────────────────────────────────────────
export interface Profile {
  id:           string;
  username:     string;
  display_name: string | null;
  avatar_url:   string | null;
  role:         'owner' | 'member';
  created_at:   string;
}

// ── API response helpers ──────────────────────────────────────────────────────
export interface ApiResult<T = void> {
  success: boolean;
  data?:   T;
  error?:  string;
}

// ── OMDB autocomplete result (returned by /api/omdb-search) ──────────────────
export interface OmdbSearchHit {
  imdbID: string;
  title:  string;
  year:   string;
  poster: string | null;
}

// ── Streaming embed info (returned by /api/stream/[imdbId]) ──────────────────
export interface StreamEmbed {
  sources:       { name: string; url: string }[];
  title:         string;
  type:          'movie' | 'tv';
  imdbId:        string;
  // optional metadata for sidebar
  poster_url?:   string | null;
  backdrop_url?: string | null;
  plot?:         string | null;
  cast_list?:    { name: string; profile_path: string | null }[] | string[] | null;
  genre_tags?:   string[] | null;
  year?:         number | null;
  director?:     string | null;
  runtime_min?:  number | null;
  imdb_rating?:  number | null;
}
