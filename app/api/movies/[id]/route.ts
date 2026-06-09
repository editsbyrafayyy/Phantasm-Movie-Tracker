import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { fetchOmdbById } from '@/lib/omdb';
import { enrichFromTmdb } from '@/lib/tmdb';
import { computeTotal } from '@/lib/config';
import { guardOwnerEntry, OWNER_ID } from '@/lib/guards';
import type { MovieFormData } from '@/lib/types';

type Params = { params: Promise<{ id: string }> };

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

// ── GET /api/movies/[id] ──────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const { id }   = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('id', id)
    .eq('user_id', user.id)   // belt-and-suspenders on top of RLS
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

// ── PATCH /api/movies/[id] ────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id }   = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Partial<MovieFormData> & { must_watch?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Score validation
  const SCORE_LIMITS: Record<string, number> = {
    atmosphere: 2, story: 2,
    characters: 1, pacing: 1, visuals: 1, thrill: 1, sound: 1, impact: 1,
  };
  for (const [field, max] of Object.entries(SCORE_LIMITS)) {
    const val = (body as any)[field];
    if (val !== '' && val !== null && val !== undefined) {
      const n = Number(val);
      if (isNaN(n) || n < 0 || n > max) {
        return NextResponse.json({ error: `Invalid value for ${field}. Maximum allowed is ${max}.` }, { status: 400 });
      }
    }
  }

  // Verify the entry belongs to this user (extra check on top of RLS)
  const { data: existing, error: fetchError } = await supabase
    .from('entries')
    .select('id, user_id, movie_id, movie:movies (title, omdb_id, media_type)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  const guard = guardOwnerEntry(user.id, existing.user_id);
  if (guard) return guard;

  // Quick toggle logic if only updating must_watch
  if (body.must_watch !== undefined && Object.keys(body).every(k => k === 'must_watch')) {
    if (user.id !== OWNER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { data, error } = await supabase
      .from('entries')
      .update({ must_watch: body.must_watch })
      .eq('id', id)
      .select('*, movie:movies (*)')
      .single();

    if (error || !data) {
      console.error('PATCH /api/movies/[id] must_watch error', error);
      return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 });
    }

    if (user.id === OWNER_ID) {
      revalidateTag('owner-entries');
    }
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, entry: data });
  }

  // Cast existing movie properly
  const movieMeta = (existing as unknown as { movie: { title: string; omdb_id: string | null; media_type: 'movie' | 'tv' | null } | null }).movie;

  const oldTitle = movieMeta?.title;
  const oldOmdbId = movieMeta?.omdb_id;
  const mediaType = movieMeta?.media_type || 'movie';

  const newTitle = body.title?.trim();
  const newOmdbId = body.omdbId === undefined ? oldOmdbId : (body.omdbId || null);

  const titleChanged = newTitle !== undefined && newTitle !== oldTitle;
  const omdbChanged = body.omdbId !== undefined && newOmdbId !== oldOmdbId;

  console.log('PATCH Movie Debug Info:', {
    body,
    oldTitle,
    oldOmdbId,
    newTitle,
    newOmdbId,
    titleChanged,
    omdbChanged
  });

  let resolvedMovieId = existing.movie_id;

  if (titleChanged || omdbChanged) {
    const serviceClient = createServiceClient();
    const finalTitle = newTitle !== undefined ? newTitle : (oldTitle || '');
    const finalOmdbId = newOmdbId;

    if (finalOmdbId) {
      // 1. Fetch OMDb details
      const omdbData = await fetchOmdbById(finalOmdbId);
      const moviePayload: MoviePayload = omdbData
        ? { ...omdbData, title: omdbData.title }
        : { omdb_id: finalOmdbId, title: finalTitle };

      // 2. Fetch TMDB details in real-time for backdrop + cast (ONLY for this movie!)
      const tmdbData = await enrichFromTmdb(
        moviePayload.title,
        moviePayload.year || undefined,
        mediaType,
        finalOmdbId
      );

      if (tmdbData.tmdb_id) {
        Object.assign(moviePayload, {
          tmdb_id:      tmdbData.tmdb_id,
          backdrop_url: tmdbData.backdrop_url,
          cast_list:    tmdbData.cast_list,
          media_type:   tmdbData.media_type || mediaType,
        });
        // Use TMDB poster fallback if OMDb didn't return one
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
        .eq('omdb_id', finalOmdbId)
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
          console.error('movies update error in PATCH', movieError);
          return NextResponse.json({ error: 'Failed to update movie metadata' }, { status: 500 });
        }
        resolvedMovieId = movie.id;
      } else {
        // Insert new movie
        const { data: movie, error: movieError } = await serviceClient
          .from('movies')
          .insert(moviePayload)
          .select('id')
          .single();

        if (movieError || !movie) {
          console.error('movies insert error in PATCH', movieError);
          return NextResponse.json({ error: 'Failed to save movie metadata' }, { status: 500 });
        }
        resolvedMovieId = movie.id;
      }
    } else {
      // Manual entry (no omdbId)
      const normalised = finalTitle.trim();

      // Check if there is an existing movie row with this normalized title
      const { data: existingMovie } = await serviceClient
        .from('movies')
        .select('id')
        .ilike('title', normalised)
        .maybeSingle();

      if (existingMovie) {
        resolvedMovieId = existingMovie.id;
      } else {
        // Create a new movie row since it doesn't exist
        const insertPayload: MoviePayload = {
          title: normalised,
        };

        // Try searching TMDB with manual title to get backdrop + cast!
        const tmdbData = await enrichFromTmdb(normalised, undefined, mediaType, null);
        if (tmdbData.tmdb_id) {
          Object.assign(insertPayload, {
            tmdb_id:      tmdbData.tmdb_id,
            backdrop_url: tmdbData.backdrop_url,
            cast_list:    tmdbData.cast_list,
            media_type:   tmdbData.media_type || mediaType,
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
            console.error('movies update error in PATCH', movieError);
            return NextResponse.json({ error: 'Failed to update manual movie' }, { status: 500 });
          }
          resolvedMovieId = movie.id;
        } else {
          // Insert it
          const { data: movie, error: movieError } = await serviceClient
            .from('movies')
            .insert(insertPayload)
            .select('id')
            .single();

          if (movieError || !movie) {
            console.error('movies insert error in PATCH', movieError);
            return NextResponse.json({ error: 'Failed to save manual movie' }, { status: 500 });
          }
          resolvedMovieId = movie.id;
        }
      }
    }
  }

  // Check for duplicate entry if movie_id changed
  if (resolvedMovieId !== existing.movie_id) {
    const { data: duplicateEntry } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', resolvedMovieId)
      .neq('id', id)
      .maybeSingle();

    if (duplicateEntry) {
      return NextResponse.json(
        { error: 'You already have this movie in your vault.' },
        { status: 409 }
      );
    }
  }

  const total = computeTotal({
    atmosphere: body.atmosphere ?? '',
    story:      body.story      ?? '',
    characters: body.characters ?? '',
    pacing:     body.pacing     ?? '',
    visuals:    body.visuals    ?? '',
    thrill:     body.thrill     ?? '',
    sound:      body.sound      ?? '',
    impact:     body.impact     ?? '',
    bonus:      body.bonus      ?? 0,
  });

  const { data, error } = await supabase
    .from('entries')
    .update({
      movie_id:      resolvedMovieId,
      subgenre:      body.subgenre      ?? undefined,
      secondary_tag: body.secondaryTag  ?? null,
      recommend:     body.recommend     || null,
      atmosphere:    body.atmosphere !== '' ? body.atmosphere : null,
      story:         body.story      !== '' ? body.story      : null,
      characters:    body.characters !== '' ? body.characters : null,
      pacing:        body.pacing     !== '' ? body.pacing     : null,
      visuals:       body.visuals    !== '' ? body.visuals    : null,
      thrill:        body.thrill     !== '' ? body.thrill     : null,
      sound:         body.sound      !== '' ? body.sound      : null,
      impact:        body.impact     !== '' ? body.impact     : null,
      bonus:         body.bonus      ?? 0,
      total,
      must_watch:    (body.must_watch !== undefined && user.id === OWNER_ID) ? body.must_watch : undefined,
    })
    .eq('id', id)
    .select('*, movie:movies (*)')
    .single();

  if (error || !data) {
    console.error('PATCH /api/movies/[id] error', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }

  if (user.id === OWNER_ID) {
    revalidateTag('owner-entries');
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true, entry: data });
}

// ── DELETE /api/movies/[id] ───────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id }   = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing, error: fetchError } = await supabase
    .from('entries')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  const guard = guardOwnerEntry(user.id, existing.user_id);
  if (guard) return guard;

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('DELETE /api/movies/[id] error', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }

  if (user.id === OWNER_ID) {
    revalidateTag('owner-entries');
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true });
}
