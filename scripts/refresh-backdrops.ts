/**
 * scripts/refresh-backdrops.ts
 *
 * Fetches TMDB backdrop images, poster fallbacks, and cast lists for all movies
 * that are missing backdrop_url. Run once after v3 schema migration.
 *
 * Usage: npx tsx scripts/refresh-backdrops.ts
 *
 * Security: reads TMDB_API_KEY from .env.local only. Never logs the key.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { enrichFromTmdb } from '../lib/tmdb';
import ws from 'ws';

// ── Supabase service client (bypasses RLS) ────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  {
    realtime: {
      // @ts-expect-error - ws typing is slightly incompatible with WebSocketsLikeConstructor
      transport: ws,
    },
  }
);

// ── Rate limiter ──────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎬 Vault v3 — Backdrop Refresh Script\n');

  if (!process.env.TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY is not set in .env.local. Aborting.');
    process.exit(1);
  }

  // Fetch all movies to update cast_lists to the new object format
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title, year, omdb_id, poster_url, backdrop_url, tmdb_id, media_type');

  if (error) {
    console.error('❌ Failed to fetch movies from Supabase:', error.message);
    process.exit(1);
  }

  if (!movies || movies.length === 0) {
    console.log('✅ All movies already have backdrops. Nothing to do.');
    return;
  }

  console.log(`Found ${movies.length} movies missing backdrop images.\n`);

  let ok = 0, skipped = 0, failed = 0;

  for (const movie of movies) {
    const type = (movie.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv';

    // Clean title (strip year from parentheses e.g. "Hereditary (2018)")
    const cleanTitle = movie.title.replace(/\s*\(\d{4}\)\s*$/, '').replace(/\s*\(show\)\s*$/i, '').trim();
    const year = movie.year ?? undefined;

    const enriched = await enrichFromTmdb(cleanTitle, year, type, movie.omdb_id);

    if (!enriched.tmdb_id) {
      console.log(`  ⚠️  NO TMDB: ${movie.title}`);
      skipped++;
      await sleep(260);
      continue;
    }

    const updates: Record<string, unknown> = {
      tmdb_id:      enriched.tmdb_id,
      backdrop_url: enriched.backdrop_url,
      cast_list:    enriched.cast_list,
    };

    // Only fill poster if OMDb didn't already provide one
    if (!movie.poster_url && enriched.poster_url) {
      updates.poster_url = enriched.poster_url;
    }

    const { error: updateError } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movie.id);

    if (updateError) {
      console.error(`  ❌ FAIL: ${movie.title} — ${updateError.message}`);
      failed++;
    } else {
      const hasBd = enriched.backdrop_url ? '🖼️ ' : '   ';
      console.log(`  ${hasBd} OK: ${movie.title} (TMDB: ${enriched.tmdb_id})`);
      ok++;
    }

    // TMDB allows 40 req/s on free tier — stay well under
    await sleep(260);
  }

  console.log(`\n────────────────────────────────`);
  console.log(`✅ Success:  ${ok}`);
  console.log(`⚠️  No TMDB: ${skipped}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log(`Total:      ${movies.length}\n`);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
