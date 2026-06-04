/**
 * One-time migration script: Google Sheet → Supabase
 *
 * Usage (run locally once, never deploy):
 *   OWNER_USER_ID=<your-supabase-user-uuid> npx ts-node scripts/migrate-from-sheet.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OMDB_API_KEY
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_SHEET_ID
 *   GOOGLE_SHEET_NAME (default: "Movies List")
 *   OWNER_USER_ID (Supabase UUID of the owner account)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { google }     from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OMDB_KEY          = process.env.OMDB_API_KEY!;
const OWNER_USER_ID     = process.env.OWNER_USER_ID!;
const SHEET_ID          = process.env.GOOGLE_SHEET_ID!;
const SHEET_NAME        = process.env.GOOGLE_SHEET_NAME ?? 'Movies List';
const DATA_START_ROW    = 3; // Row 1 = count, Row 2 = header

// Column indices in the sheet (0-based within the fetched range B:O)
const COL = {
  TITLE:         0,  // B
  SUBGENRE:      1,  // C
  SECONDARY_TAG: 2,  // D
  RECOMMEND:     3,  // E
  ATMOSPHERE:    4,  // F
  STORY:         5,  // G
  CHARACTERS:    6,  // H
  PACING:        7,  // I
  VISUALS:       8,  // J
  THRILL:        9,  // K
  SOUND:         10, // L
  IMPACT:        11, // M
  TOTAL:         12, // N
  BONUS:         13, // O
};

// ── Supabase service client ────────────────────────────────────────────────────

// Mock WebSocket to bypass Supabase Realtime check in Node < 22
// @ts-expect-error - WebSocket does not exist on global
global.WebSocket = class {};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Google Sheets auth ────────────────────────────────────────────────────────

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email:  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key:   process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseNum(v: unknown): number | null {
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function parseTitleAndYear(title: string): { cleanTitle: string; year: string | null; isShow: boolean } {
  let cleanTitle = title.trim();
  let isShow = false;

  // 1. Detect (show) or similar suffixes
  const showMatch = cleanTitle.match(/^(.*?)\s*\((show|tv show|series|miniseries)\)\s*$/i);
  if (showMatch) {
    cleanTitle = showMatch[1].trim();
    isShow = true;
  }

  // 2. Detect year
  const yearMatch = cleanTitle.match(/^(.*?)\s*\((\d{4})\)\s*$/);
  if (yearMatch) {
    return {
      cleanTitle: yearMatch[1].trim(),
      year: yearMatch[2],
      isShow,
    };
  }

  return {
    cleanTitle,
    year: null,
    isShow,
  };
}

interface OmdbDetail {
  imdbID?:      string;
  Title?:       string;
  Poster?:      string;
  Year?:        string;
  Director?:    string;
  Runtime?:     string;
  Plot?:        string;
  imdbRating?:  string;
  Genre?:       string;
  Response?:    string;
}

function parseOmdbDetail(data: OmdbDetail) {
  return {
    omdb_id:     data.imdbID ?? null,
    title:       data.Title ?? 'Unknown',
    poster_url:  data.Poster && data.Poster !== 'N/A' ? data.Poster : null,
    year:        data.Year ? (parseInt(data.Year) || null) : null,
    director:    data.Director && data.Director !== 'N/A' ? data.Director : null,
    runtime_min: data.Runtime ? (parseInt(data.Runtime) || null) : null,
    plot:        data.Plot && data.Plot !== 'N/A' ? data.Plot : null,
    imdb_rating: data.imdbRating ? (parseFloat(data.imdbRating) || null) : null,
    genre_tags:  data.Genre && data.Genre !== 'N/A' ? data.Genre.split(', ') : [],
  };
}

async function fetchOMDBPrecise(title: string) {
  const { cleanTitle, year, isShow } = parseTitleAndYear(title);
  const typeParam = isShow ? 'series' : 'movie';

  // 1. Try precise match first (t=Title & y=Year & type=series/movie)
  let url = `https://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&type=${typeParam}&apikey=${OMDB_KEY}`;
  if (year) {
    url += `&y=${year}`;
  }

  try {
    let res = await fetch(url);
    let data = await res.json();

    if (data.Response === 'True') {
      return parseOmdbDetail(data);
    }

    // 2. If it had a year and failed, try without the year
    if (year) {
      const urlNoYear = `https://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&type=${typeParam}&apikey=${OMDB_KEY}`;
      res = await fetch(urlNoYear);
      data = await res.json();
      if (data.Response === 'True') {
        return parseOmdbDetail(data);
      }
    }

    // 3. Try without type constraint (in case OMDB has a mismatch)
    let urlNoType = `https://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&apikey=${OMDB_KEY}`;
    if (year) {
      urlNoType += `&y=${year}`;
    }
    res = await fetch(urlNoType);
    data = await res.json();
    if (data.Response === 'True') {
      return parseOmdbDetail(data);
    }

    // 4. Fallback to search s=... but verify it's a close title match
    const searchUrl = `https://www.omdbapi.com/?s=${encodeURIComponent(cleanTitle)}&apikey=${OMDB_KEY}`;
    res = await fetch(searchUrl);
    const searchData = await res.json();
    const hit = searchData.Search?.[0];
    if (hit?.imdbID) {
      const hitTitle = String(hit.Title).toLowerCase();
      const queryTitle = cleanTitle.toLowerCase();

      // Only accept if the query title matches the hit title closely
      if (hitTitle.includes(queryTitle) || queryTitle.includes(hitTitle)) {
        const detailUrl = `https://www.omdbapi.com/?i=${hit.imdbID}&apikey=${OMDB_KEY}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        if (detailData.Response === 'True') {
          return parseOmdbDetail(detailData);
        }
      }
    }
  } catch (err) {
    console.error(`⚠️ OMDB API error for "${title}":`, err);
  }

  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎬 Vault Migration — Google Sheet → Supabase\n');

  if (!OWNER_USER_ID) {
    console.error('❌ OWNER_USER_ID env var is required. Set it to your Supabase user UUID.');
    process.exit(1);
  }

  // Clear existing entries and movies (safe delete using neq filter)
  console.log('🧹 Clearing existing entries and movies from database...');
  const { error: clearEntriesErr } = await supabase.from('entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (clearEntriesErr) console.warn('Warning clearing entries:', clearEntriesErr.message);

  const { error: clearMoviesErr } = await supabase.from('movies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (clearMoviesErr) console.warn('Warning clearing movies:', clearMoviesErr.message);
  console.log('🧹 Database cleared.\n');

  // Read sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range:         `${SHEET_NAME}!B${DATA_START_ROW}:O`,
  });

  const rows = response.data.values ?? [];
  console.log(`📋 Found ${rows.length} rows in sheet\n`);

  let migrated = 0;
  let skipped  = 0;
  let noOmdb   = 0;
  let failed   = 0;

  for (const row of rows) {
    const title = String(row[COL.TITLE] ?? '').trim();
    if (!title) continue;

    try {
      // Check if movie already exists for this title (case-insensitive) to prevent duplicates
      const { data: existingMovie } = await supabase
        .from('movies')
        .select('id')
        .ilike('title', title)
        .maybeSingle();

      if (existingMovie) {
        const { data: existingEntry } = await supabase
          .from('entries')
          .select('id')
          .eq('user_id', OWNER_USER_ID)
          .eq('movie_id', existingMovie.id)
          .maybeSingle();

        if (existingEntry) {
          console.log(`⏭  SKIPPED: "${title}" (already exists)`);
          skipped++;
          continue;
        }
      }

      // OMDB lookup
      let movieRow: Record<string, unknown> = { title };
      let omdbNote = '';

      const detail = await fetchOMDBPrecise(title);
      if (detail) {
        // ONLY override title if it is a very close match. Otherwise keep sheet title!
        const cleanOriginal = parseTitleAndYear(title).cleanTitle.toLowerCase();
        const cleanMatched = parseTitleAndYear(detail.title).cleanTitle.toLowerCase();

        if (cleanMatched.includes(cleanOriginal) || cleanOriginal.includes(cleanMatched)) {
          movieRow = detail;
        } else {
          // If titles diverge (e.g. search returned different movie), keep sheet title but keep metadata/poster
          movieRow = { ...detail, title };
        }
        omdbNote = ` (${detail.omdb_id})`;
      } else {
        noOmdb++;
        omdbNote = ' [no OMDB match]';
      }

      // Upsert movies row
      const { data: movie, error: movieErr } = await supabase
        .from('movies')
        .upsert(
          existingMovie ? { id: existingMovie.id, ...movieRow } : movieRow,
          { onConflict: 'omdb_id', ignoreDuplicates: false }
        )
        .select('id')
        .single();

      if (movieErr || !movie) {
        console.error(`❌ FAILED movies upsert for "${title}":`, movieErr?.message);
        failed++;
        continue;
      }

      // Compute total from sheet value (or re-sum)
      const total = parseNum(row[COL.TOTAL]);
      const bonus = parseNum(row[COL.BONUS]) === 1 ? 1 : 0;

      // Insert entry
      const entryPayload = {
        user_id:       OWNER_USER_ID,
        movie_id:      movie.id,
        subgenre:      String(row[COL.SUBGENRE]  ?? ''),
        secondary_tag: String(row[COL.SECONDARY_TAG] ?? '') || null,
        recommend:     String(row[COL.RECOMMEND]  ?? '') || null,
        atmosphere:    parseNum(row[COL.ATMOSPHERE]),
        story:         parseNum(row[COL.STORY]),
        characters:    parseNum(row[COL.CHARACTERS]),
        pacing:        parseNum(row[COL.PACING]),
        visuals:       parseNum(row[COL.VISUALS]),
        thrill:        parseNum(row[COL.THRILL]),
        sound:         parseNum(row[COL.SOUND]),
        impact:        parseNum(row[COL.IMPACT]),
        bonus,
        total,
      };

      const { error: entryErr } = await supabase.from('entries').insert(entryPayload);
      if (entryErr) {
        console.error(`❌ FAILED entry insert for "${title}":`, entryErr.message);
        failed++;
        continue;
      }

      console.log(`✅ MIGRATED: "${title}"${omdbNote}`);
      migrated++;

      // Small delay to respect OMDB rate limit
      await new Promise(r => setTimeout(r, 150));

    } catch (err) {
      console.error(`❌ ERROR: "${title}":`, err);
      failed++;
    }
  }

  console.log(`\n── Migration complete ──────────────────────`);
  console.log(`✅ Migrated:  ${migrated}`);
  console.log(`⏭  Skipped:   ${skipped}`);
  console.log(`🔍 No OMDB:   ${noOmdb}`);
  console.log(`❌ Failed:    ${failed}`);
}

main().catch(err => { console.error(err); process.exit(1); });
