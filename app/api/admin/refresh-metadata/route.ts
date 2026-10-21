import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { selectAll } from '@/lib/selectAll';
import { fetchOmdbById } from '@/lib/omdb';
import { enrichFromTmdb, fetchTmdbDetail } from '@/lib/tmdb';
import { CATALOG_FIELDS, needsFix, type CatalogMovie } from '@/lib/catalogHealth';
import { ownerOnly } from '../_owner';

/** Films per request — keeps each call well inside serverless time limits. */
const BATCH = 10;

/**
 * POST { after?: string } — re-fetch OMDB/TMDB data for catalog films with gaps.
 * Only empty fields are filled; nothing already set is overwritten.
 * Processes films in id order after the `after` cursor, BATCH at a time, so the
 * client can keep calling with `next` until it comes back null.
 */
export async function POST(request: Request) {
  const denied = await ownerOnly();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const after = typeof body.after === 'string' ? body.after : '';

  const service = createServiceClient();
  const { data: movies, error } = await selectAll<CatalogMovie>((a, b) =>
    service.from('movies').select(CATALOG_FIELDS).order('id').range(a, b) as unknown as PromiseLike<{ data: CatalogMovie[] | null; error: unknown }>);
  if (error) {
    console.error('[POST /api/admin/refresh-metadata]', error);
    return NextResponse.json({ error: 'Failed to read the catalog' }, { status: 500 });
  }

  const pending = movies.filter(m => m.id > after && needsFix(m));
  const batch = pending.slice(0, BATCH);
  let fixed = 0;

  for (const m of batch) {
    const patch: Partial<CatalogMovie> = {};
    const type = m.media_type === 'tv' ? 'tv' : 'movie';

    if (m.omdb_id) {
      const omdb = await fetchOmdbById(m.omdb_id).catch(() => null);
      if (omdb) {
        if (!m.poster_url && omdb.poster_url)   patch.poster_url = omdb.poster_url;
        if (!m.year && omdb.year)               patch.year = omdb.year;
        if (!m.runtime_min && omdb.runtime_min) patch.runtime_min = omdb.runtime_min;
        if (!m.imdb_rating && omdb.imdb_rating) patch.imdb_rating = omdb.imdb_rating;
      }
    }

    // A bare-title search (no IMDb id, no year) too easily lands on the wrong film,
    // so those are left for a manual "Fix match" on the Edit page.
    const stillNoArt = !(m.poster_url || patch.poster_url) && !m.backdrop_url;
    const reliable = !!m.omdb_id || !!(m.year || patch.year);
    if (reliable && (stillNoArt || !m.tmdb_id)) {
      const tmdb = await enrichFromTmdb(m.title, m.year ?? undefined, type, m.omdb_id).catch(() => null);
      if (tmdb) {
        if (!m.poster_url && !patch.poster_url && tmdb.poster_url) patch.poster_url = tmdb.poster_url;
        if (!m.backdrop_url && tmdb.backdrop_url) patch.backdrop_url = tmdb.backdrop_url;
        if (!m.tmdb_id && tmdb.tmdb_id) patch.tmdb_id = tmdb.tmdb_id;
      }
    }

    const tmdbId = m.tmdb_id ?? patch.tmdb_id;
    const needRuntime = type === 'movie' && !m.runtime_min && !patch.runtime_min;
    if (tmdbId && (needRuntime || (!m.year && !patch.year))) {
      const detail = await fetchTmdbDetail(tmdbId, type).catch(() => null);
      if (detail) {
        if (needRuntime && detail.runtime) patch.runtime_min = detail.runtime;
        const date = detail.release_date || detail.first_air_date;
        if (!m.year && !patch.year && date) patch.year = Number(date.slice(0, 4)) || null;
      }
    }

    if (Object.keys(patch).length) {
      const { error: upErr } = await service.from('movies').update(patch).eq('id', m.id);
      if (upErr) console.error('[POST /api/admin/refresh-metadata] update', m.id, upErr);
      else fixed++;
    }
  }

  if (fixed) revalidateTag('owner-entries', { expire: 0 });

  const done = pending.length <= BATCH;
  return NextResponse.json({
    checked: batch.length,
    fixed,
    remaining: Math.max(0, pending.length - batch.length),
    next: done ? null : batch[batch.length - 1].id,
  });
}
