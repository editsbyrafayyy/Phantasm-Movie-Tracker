/** What the admin "Catalog health" card checks, shared by the page and the fixer route. */
export interface CatalogMovie {
  id:           string;
  title:        string;
  year:         number | null;
  poster_url:   string | null;
  backdrop_url: string | null;
  runtime_min:  number | null;
  imdb_rating:  number | null;
  omdb_id:      string | null;
  tmdb_id:      number | null;
  media_type:   'movie' | 'tv' | null;
}

export const CATALOG_FIELDS = 'id, title, year, poster_url, backdrop_url, runtime_min, imdb_rating, omdb_id, tmdb_id, media_type';

export const missingArtwork = (m: CatalogMovie) => !m.poster_url && !m.backdrop_url;
// Series have no single runtime, so only films need one.
export const missingDetails = (m: CatalogMovie) => !m.year || (m.media_type !== 'tv' && !m.runtime_min);
export const missingImdb    = (m: CatalogMovie) => !m.imdb_rating;

export const needsFix = (m: CatalogMovie) => missingArtwork(m) || missingDetails(m) || missingImdb(m);
