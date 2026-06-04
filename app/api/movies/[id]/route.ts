import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { fetchOmdbById } from '@/lib/omdb';
import { enrichFromTmdb } from '@/lib/tmdb';
import { computeTotal } from '@/lib/config';
import type { MovieFormData } from '@/lib/types';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/movies/[id] ──────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const { id }   = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('id', id)
    .eq('user_id', session.user.id)   // belt-and-suspenders on top of RLS
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
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Partial<MovieFormData>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Verify the entry belongs to this user (extra check on top of RLS)
  const { data: existing, error: fetchError } = await supabase
    .from('entries')
    .select('id, user_id, movie_id, movie:movies (title, omdb_id, media_type)')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  // Cast existing movie properly
  const movieMeta = (existing as any).movie as { title: string; omdb_id: string | null; media_type: 'movie' | 'tv' | null } | null;

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
      const moviePayload: Record<string, any> = omdbData
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

      // Upsert by omdb_id
      const { data: movie, error: movieError } = await serviceClient
        .from('movies')
        .upsert(moviePayload, { onConflict: 'omdb_id', ignoreDuplicates: false })
        .select('id')
        .single();

      if (movieError || !movie) {
        console.error('movies upsert error in PATCH', movieError);
        return NextResponse.json({ error: 'Failed to update movie metadata' }, { status: 500 });
      }

      resolvedMovieId = movie.id;
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
        const insertPayload: Record<string, any> = {
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

  // Check for duplicate entry if movie_id changed
  if (resolvedMovieId !== existing.movie_id) {
    const { data: duplicateEntry } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', session.user.id)
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
    })
    .eq('id', id)
    .select('*, movie:movies (*)')
    .single();

  if (error || !data) {
    console.error('PATCH /api/movies/[id] error', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true, entry: data });
}

// ── DELETE /api/movies/[id] ───────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id }   = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) {
    console.error('DELETE /api/movies/[id] error', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true });
}
