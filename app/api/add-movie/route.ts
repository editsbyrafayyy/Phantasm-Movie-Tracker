import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { fetchOmdbById } from '@/lib/omdb';
import { enrichFromTmdb } from '@/lib/tmdb';
import { computeTotal, SUBGENRES } from '@/lib/config';
import { rateLimit } from '@/lib/ratelimit';
import type { MovieFormData } from '@/lib/types';

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip)) {
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

  const { omdbId, subgenre, secondaryTag, recommend, bonus, ...scores } = body;

  const title = String(body.title ?? '').trim().slice(0, 200);
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!SUBGENRES.includes(subgenre as typeof SUBGENRES[number])) {
    return NextResponse.json({ error: 'Invalid subgenre' }, { status: 400 });
  }

  const SCORE_LIMITS: Record<string, number> = {
    atmosphere: 2, story: 2,
    characters: 1, pacing: 1, visuals: 1, thrill: 1, sound: 1, impact: 1,
  };
  for (const [field, max] of Object.entries(SCORE_LIMITS)) {
    const val = (body as any)[field];
    if (val !== '' && val !== null && val !== undefined) {
      const n = Number(val);
      if (isNaN(n) || n < 0 || n > max) {
        return NextResponse.json({ error: `Invalid value for ${field}.` }, { status: 400 });
      }
    }
  }

  // Service client for writes to the shared movies table (bypasses RLS)
  const serviceClient = createServiceClient();

  interface MoviePayload {
    title: string;
    year?: number | null;
    poster_url?: string | null;
    omdb_id?: string | null;
    tmdb_id?: number | null;
    backdrop_url?: string | null;
    cast_list?: string[] | null;
    media_type?: string;
  }

  // ── Upsert the movies row ──────────────────────────────────────────────────
  let movieId: string;

  if (omdbId) {
    // Fetch full OMDB record and upsert by omdb_id
    const omdbData = await fetchOmdbById(omdbId);

    const moviePayload: MoviePayload = omdbData
      ? { ...omdbData, title: omdbData.title }
      : { omdb_id: omdbId, title: title.trim() };

    // Fetch TMDB backdrop and cast in real-time
    const tmdbData = await enrichFromTmdb(
      moviePayload.title,
      moviePayload.year || undefined,
      'movie',
      omdbId
    );

    if (tmdbData.tmdb_id) {
      Object.assign(moviePayload, {
        tmdb_id:      tmdbData.tmdb_id,
        backdrop_url: tmdbData.backdrop_url,
        cast_list:    tmdbData.cast_list,
        media_type:   tmdbData.media_type || 'movie',
      });
      // Fallback poster
      if (!moviePayload.poster_url && tmdbData.poster_url) {
        moviePayload.poster_url = tmdbData.poster_url;
      }
    }

    // Look up existing movie to avoid unique key constraint violations on tmdb_id or omdb_id
    let existingMovie = null;

    // Check by omdb_id
    const { data: byOmdb } = await serviceClient
      .from('movies')
      .select('id')
      .eq('omdb_id', omdbId)
      .maybeSingle();

    if (byOmdb) {
      existingMovie = byOmdb;
    } else if (moviePayload.tmdb_id) {
      // Check by tmdb_id
      const { data: byTmdb } = await serviceClient
        .from('movies')
        .select('id')
        .eq('tmdb_id', moviePayload.tmdb_id)
        .maybeSingle();
      existingMovie = byTmdb;
    }

    if (existingMovie) {
      // Update existing movie metadata
      const { data: movie, error: movieError } = await serviceClient
        .from('movies')
        .update(moviePayload)
        .eq('id', existingMovie.id)
        .select('id')
        .single();

      if (movieError || !movie) {
        console.error('movies update error', movieError);
        return NextResponse.json({ error: 'Failed to update movie metadata' }, { status: 500 });
      }
      movieId = movie.id;
    } else {
      // Insert new movie
      const { data: movie, error: movieError } = await serviceClient
        .from('movies')
        .insert(moviePayload)
        .select('id')
        .single();

      if (movieError || !movie) {
        console.error('movies insert error', movieError);
        return NextResponse.json({ error: 'Failed to save movie metadata' }, { status: 500 });
      }
      movieId = movie.id;
    }
  } else {
    // Manual entry — upsert by normalised title
    const normalised = title.trim();
    const { data: existing } = await serviceClient
      .from('movies')
      .select('id')
      .ilike('title', normalised)
      .maybeSingle();

    if (existing) {
      movieId = existing.id;
    } else {
      const insertPayload: MoviePayload = {
        title: normalised,
      };

      // Try searching TMDB with manual title to get backdrop + cast!
      const tmdbData = await enrichFromTmdb(normalised, undefined, 'movie', null);
      if (tmdbData.tmdb_id) {
        Object.assign(insertPayload, {
          tmdb_id:      tmdbData.tmdb_id,
          backdrop_url: tmdbData.backdrop_url,
          cast_list:    tmdbData.cast_list,
          media_type:   tmdbData.media_type || 'movie',
        });
        if (tmdbData.poster_url) {
          insertPayload.poster_url = tmdbData.poster_url;
        }
      }

      // Check if tmdb_id already exists to prevent unique key violation
      let manualExisting = null;
      if (insertPayload.tmdb_id) {
        const { data: byTmdb } = await serviceClient
          .from('movies')
          .select('id')
          .eq('tmdb_id', insertPayload.tmdb_id)
          .maybeSingle();
        manualExisting = byTmdb;
      }

      if (manualExisting) {
        // Update it
        const { data: movie, error: movieError } = await serviceClient
          .from('movies')
          .update(insertPayload)
          .eq('id', manualExisting.id)
          .select('id')
          .single();

        if (movieError || !movie) {
          console.error('movies update error', movieError);
          return NextResponse.json({ error: 'Failed to update movie' }, { status: 500 });
        }
        movieId = movie.id;
      } else {
        // Insert it
        const { data: movie, error: movieError } = await serviceClient
          .from('movies')
          .insert(insertPayload)
          .select('id')
          .single();

        if (movieError || !movie) {
          console.error('movies insert error', movieError);
          return NextResponse.json({ error: 'Failed to save movie' }, { status: 500 });
        }
        movieId = movie.id;
      }
    }
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
    bonus:      bonus ?? 0,
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
    bonus:         bonus ?? 0,
    total,
  };

  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .insert(entryPayload)
    .select('id, total')
    .single();

  if (entryError || !entry) {
    console.error('entries insert error', entryError);
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
  }

  const OWNER_ID = process.env.OWNER_USER_ID;
  if (userId === OWNER_ID) {
    revalidateTag('owner-entries', 'max');
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true, entry }, { status: 201 });
}
