import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { fetchOmdbById } from '@/lib/omdb';
import { enrichFromTmdb, fetchTmdbDetail, tmdbBackdropUrl, tmdbCastList, tmdbPosterUrl, type TmdbMovieDetail } from '@/lib/tmdb';
import { computeTotal, SUBGENRES } from '@/lib/config';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import type { MovieFormData } from '@/lib/types';
import {
  escapeLike,
  insertMovieOrGetExisting,
  isAcceptableMovieRef,
  isValidBonus,
  isValidRecommend,
  isValidSecondaryTag,
  sanitizeCustomTags,
  TMDB_REF_RE,
} from '../_lib/entryValidation';

const normTitle = (t?: string) => (t ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * TMDB movie and TV ids overlap, so an untyped ref is checked against both and the
 * one whose name matches the submitted title wins (movie when neither does).
 */
async function resolveTmdbRef(
  tmdbId: number,
  hint: 'tv' | null,
  title: string,
): Promise<{ detail: TmdbMovieDetail; type: 'movie' | 'tv' } | null> {
  if (hint === 'tv') {
    const tv = await fetchTmdbDetail(tmdbId, 'tv');
    return tv?.id ? { detail: tv, type: 'tv' } : null;
  }
  const [movie, tv] = await Promise.all([fetchTmdbDetail(tmdbId, 'movie'), fetchTmdbDetail(tmdbId, 'tv')]);
  const want = normTitle(title);
  if (tv?.id && normTitle(tv.name) === want && normTitle(movie?.title) !== want) return { detail: tv, type: 'tv' };
  if (movie?.id) return { detail: movie, type: 'movie' };
  return tv?.id ? { detail: tv, type: 'tv' } : null;
}

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  const ip = getClientIp(req);
  if (!rateLimit(ip, 30, 60_000, 'POST /api/add-movie')) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  // ── Parse + validate body ──────────────────────────────────────────────────
  const rawBodyText = await req.text();
  if (rawBodyText.length > 4096) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
  }

  let body: MovieFormData;
  try {
    body = JSON.parse(rawBodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { omdbId, subgenre, secondaryTag, recommend, bonus, notes, custom_tags, ...scores } = body;

  const title = String(body.title ?? '').trim().slice(0, 200);
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!SUBGENRES.includes(subgenre as typeof SUBGENRES[number])) {
    return NextResponse.json({ error: 'Invalid subgenre' }, { status: 400 });
  }

  if (omdbId && !isAcceptableMovieRef(omdbId)) {
    return NextResponse.json({ error: 'Invalid IMDb ID' }, { status: 400 });
  }
  if (!isValidSecondaryTag(secondaryTag)) {
    return NextResponse.json({ error: 'Invalid secondary tag' }, { status: 400 });
  }
  if (!isValidRecommend(recommend)) {
    return NextResponse.json({ error: 'Invalid recommendation' }, { status: 400 });
  }
  if (!isValidBonus(bonus)) {
    return NextResponse.json({ error: 'Invalid bonus value' }, { status: 400 });
  }
  const cleanTags = sanitizeCustomTags(custom_tags);
  if (cleanTags === null) {
    return NextResponse.json({ error: 'Invalid tags (max 20 tags, 40 characters each)' }, { status: 400 });
  }

  const SCORE_LIMITS: Record<string, number> = {
    atmosphere: 2, story: 2,
    characters: 1, pacing: 1, visuals: 1, thrill: 1, sound: 1, impact: 1,
  };
  for (const [field, max] of Object.entries(SCORE_LIMITS)) {
    const val = body[field as keyof MovieFormData];
    if (val !== '' && val !== null && val !== undefined) {
      const n = Number(val);
      if (isNaN(n) || n < 0 || n > max) {
        return NextResponse.json({ error: `Invalid value for ${field}. Maximum allowed is ${max}.` }, { status: 400 });
      }
    }
  }

  // Service client for writes to the shared movies table (bypasses RLS)
  const serviceClient = createServiceClient();

  const findMovie = async (column: 'omdb_id' | 'tmdb_id', value: string | number) => {
    const { data } = await serviceClient.from('movies').select('id').eq(column, value).limit(1);
    return (data?.[0]?.id as string | undefined) ?? null;
  };

  /**
   * Fill only the columns an existing row is missing. The catalog is shared, so a
   * member's add never rewrites metadata — and a failed fill (e.g. a tmdb_id another
   * row already holds) must not block the rating itself.
   */
  const fillMissing = async (id: string, payload: MoviePayload) => {
    const { data: row } = await serviceClient
      .from('movies')
      .select('omdb_id, tmdb_id, year, poster_url, backdrop_url, cast_list, director, runtime_min, plot, imdb_rating, genre_tags')
      .eq('id', id)
      .maybeSingle();
    if (!row) return;
    const current = row as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (!(key in current) || value == null || (Array.isArray(value) && !value.length)) continue;
      const have = current[key];
      if (have == null || (Array.isArray(have) && !have.length)) patch[key] = value;
    }
    if (!Object.keys(patch).length) return;
    const { error } = await serviceClient.from('movies').update(patch).eq('id', id);
    if (error) console.error('movies fill error (non-fatal)', error);
  };

  /** Reuse a row matching either id (filling its gaps), else insert a new one. */
  const upsertMovie = async (payload: MoviePayload): Promise<string | null> => {
    const existing =
      (payload.omdb_id ? await findMovie('omdb_id', payload.omdb_id) : null) ??
      (payload.tmdb_id ? await findMovie('tmdb_id', payload.tmdb_id) : null);
    if (existing) {
      await fillMissing(existing, payload);
      return existing;
    }
    return insertMovieOrGetExisting(serviceClient, { ...payload });
  };

  interface MoviePayload {
    title: string;
    year?: number | null;
    poster_url?: string | null;
    omdb_id?: string | null;
    tmdb_id?: number | null;
    backdrop_url?: string | null;
    cast_list?: unknown[] | null;
    media_type?: string;
    director?: string | null;
    runtime_min?: number | null;
    plot?: string | null;
    imdb_rating?: number | null;
    genre_tags?: string[];
  }

  // ── Resolve the movies row ─────────────────────────────────────────────────
  let movieId: string | null;
  const tmdbRef = omdbId ? TMDB_REF_RE.exec(omdbId) : null;

  if (tmdbRef) {
    // Stream / Browse links carry a TMDB id. Resolve it to the real title (and its
    // IMDb id when TMDB knows it) — never store the `tmdb:` reference as omdb_id.
    const tmdbId = Number(tmdbRef[2]);
    movieId = await findMovie('tmdb_id', tmdbId);
    if (!movieId) {
      const resolved = await resolveTmdbRef(tmdbId, tmdbRef[1] ? 'tv' : null, title);
      if (!resolved) {
        return NextResponse.json({ error: 'Could not find that title on TMDB.' }, { status: 404 });
      }
      const { detail, type } = resolved;
      const imdbId = detail.external_ids?.imdb_id || null;
      const omdbData = imdbId ? await fetchOmdbById(imdbId) : null;
      const firstDate = detail.release_date || detail.first_air_date || '';
      movieId = await upsertMovie({
        ...(omdbData ?? {}),
        title:        omdbData?.title ?? detail.title ?? detail.name ?? title,
        omdb_id:      imdbId,
        tmdb_id:      tmdbId,
        media_type:   type,
        year:         omdbData?.year ?? (Number(firstDate.slice(0, 4)) || null),
        poster_url:   omdbData?.poster_url ?? tmdbPosterUrl(detail.poster_path),
        backdrop_url: tmdbBackdropUrl(detail.backdrop_path),
        cast_list:    tmdbCastList(detail),
        runtime_min:  omdbData?.runtime_min ?? detail.runtime ?? null,
        plot:         omdbData?.plot ?? detail.overview ?? null,
      });
    }
  } else if (omdbId) {
    // Most adds are films already in the catalog — skip the metadata fetches for those.
    movieId = await findMovie('omdb_id', omdbId);
    if (!movieId) {
      const omdbData = await fetchOmdbById(omdbId);
      const moviePayload: MoviePayload = omdbData
        ? { ...omdbData, title: omdbData.title }
        : { omdb_id: omdbId, title };

      // TMDB backdrop and cast (matched by IMDb id first)
      const tmdbData = await enrichFromTmdb(moviePayload.title, moviePayload.year || undefined, 'movie', omdbId);
      if (tmdbData.tmdb_id) {
        Object.assign(moviePayload, {
          tmdb_id:      tmdbData.tmdb_id,
          backdrop_url: tmdbData.backdrop_url,
          cast_list:    tmdbData.cast_list,
          media_type:   tmdbData.media_type || 'movie',
        });
        if (!moviePayload.poster_url && tmdbData.poster_url) moviePayload.poster_url = tmdbData.poster_url;
      }
      movieId = await upsertMovie(moviePayload);
    }
  } else {
    // Manual entry — reuse a catalog row with the same title
    const { data: existing } = await serviceClient
      .from('movies')
      .select('id')
      .ilike('title', escapeLike(title))
      .limit(1);

    if (existing?.[0]) {
      movieId = existing[0].id as string;
    } else {
      const insertPayload: MoviePayload = { title };
      // Try TMDB with the typed title for backdrop + cast
      const tmdbData = await enrichFromTmdb(title, undefined, 'movie', null);
      if (tmdbData.tmdb_id) {
        Object.assign(insertPayload, {
          tmdb_id:      tmdbData.tmdb_id,
          backdrop_url: tmdbData.backdrop_url,
          cast_list:    tmdbData.cast_list,
          media_type:   tmdbData.media_type || 'movie',
        });
        if (tmdbData.poster_url) insertPayload.poster_url = tmdbData.poster_url;
      }
      movieId = await upsertMovie(insertPayload);
    }
  }

  if (!movieId) {
    return NextResponse.json({ error: 'Failed to save movie metadata' }, { status: 500 });
  }

  // ── Check for duplicate entry ──────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('entries')
    .select('id')
    .eq('user_id', userId)
    .eq('movie_id', movieId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'You have already logged this movie. Use the update form to edit your rating.' },
      { status: 409 }
    );
  }

  // ── Compute total ──────────────────────────────────────────────────────────
  const total = computeTotal({
    atmosphere: scores.atmosphere as number | '',
    story:      scores.story      as number | '',
    characters: scores.characters as number | '',
    pacing:     scores.pacing     as number | '',
    visuals:    scores.visuals    as number | '',
    thrill:     scores.thrill     as number | '',
    sound:      scores.sound      as number | '',
    impact:     scores.impact     as number | '',
    bonus:      Number(bonus ?? 0) as 0 | 1,
  });

  // ── Insert entry ──────────────────────────────────────────────────────────
  const entryPayload = {
    user_id:       userId,
    movie_id:      movieId,
    subgenre,
    secondary_tag: secondaryTag || null,
    recommend:     recommend    || null,
    atmosphere:    scores.atmosphere !== '' ? scores.atmosphere : null,
    story:         scores.story      !== '' ? scores.story      : null,
    characters:    scores.characters !== '' ? scores.characters : null,
    pacing:        scores.pacing     !== '' ? scores.pacing     : null,
    visuals:       scores.visuals    !== '' ? scores.visuals    : null,
    thrill:        scores.thrill     !== '' ? scores.thrill     : null,
    sound:         scores.sound      !== '' ? scores.sound      : null,
    impact:        scores.impact     !== '' ? scores.impact     : null,
    bonus:         Number(bonus ?? 0),
    total,
    notes:         notes ? String(notes).trim().slice(0, 500) : null,
    custom_tags:   cleanTags,
  };

  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .insert(entryPayload)
    .select('id, total')
    .single();

  if (entryError?.code === '23505') {
    return NextResponse.json(
      { error: 'You have already logged this movie. Use the update form to edit your rating.' },
      { status: 409 }
    );
  }

  if (entryError || !entry) {
    console.error('entries insert error', entryError);
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
  }

  const OWNER_ID = process.env.OWNER_USER_ID;
  if (userId === OWNER_ID) {
    // @ts-expect-error - Next.js 16 type mismatch or new API
    revalidateTag('owner-entries');
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true, entry }, { status: 201 });
}
