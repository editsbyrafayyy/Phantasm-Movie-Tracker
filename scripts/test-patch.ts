import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { enrichFromTmdb } from '../lib/tmdb';
import { fetchOmdbById } from '../lib/omdb';
import ws from 'ws';

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

async function main() {
  const entryId = '291784cf-ab2f-4ae0-8e29-58c4b966e61d';
  console.log('Testing PATCH logic for entry:', entryId);

  // 1. Fetch existing entry
  const { data: existing, error: fetchError } = await supabase
    .from('entries')
    .select('id, user_id, movie_id, movie:movies (title, omdb_id, media_type)')
    .eq('id', entryId)
    .single();

  if (fetchError || !existing) {
    console.error('Fetch error:', fetchError);
    return;
  }

  console.log('Existing entry:', JSON.stringify(existing, null, 2));

  const movieMeta = (existing as unknown as { movie: { title: string; omdb_id: string | null; media_type: 'movie' | 'tv' | null } | null }).movie;
  const oldTitle = movieMeta?.title;
  const oldOmdbId = movieMeta?.omdb_id;
  const mediaType = movieMeta?.media_type || 'movie';

  // Simulate editing title to "Drag Me to Hell (Test)"
  const body = {
    title: 'Drag Me to Hell (Test)',
    omdbId: 'tt1127180'
  };

  const newTitle = body.title.trim();
  const newOmdbId = body.omdbId || null;

  const titleChanged = newTitle !== oldTitle;
  const omdbChanged = newOmdbId !== oldOmdbId;

  console.log('Change checks:', { titleChanged, omdbChanged });

  if (titleChanged || omdbChanged) {
    const updatePayload: Record<string, unknown> = {};

    if (titleChanged) {
      updatePayload.title = newTitle;
    }
    if (omdbChanged) {
      updatePayload.omdb_id = newOmdbId;
    }

    const finalTitle = newTitle;
    const finalOmdbId = newOmdbId;

    if (finalOmdbId) {
      console.log('Fetching OMDb...');
      const omdbData = await fetchOmdbById(finalOmdbId);
      if (omdbData) {
        Object.assign(updatePayload, {
          poster_url:  omdbData.poster_url,
          year:        omdbData.year,
          director:    omdbData.director,
          runtime_min: omdbData.runtime_min,
          plot:        omdbData.plot,
          imdb_rating: omdbData.imdb_rating,
          genre_tags:  omdbData.genre_tags,
        });

        console.log('Fetching TMDB...');
        const tmdbData = await enrichFromTmdb(finalTitle, omdbData.year || undefined, mediaType, finalOmdbId);
        if (tmdbData.tmdb_id) {
          Object.assign(updatePayload, {
            tmdb_id:      tmdbData.tmdb_id,
            backdrop_url: tmdbData.backdrop_url,
            cast_list:    tmdbData.cast_list,
          });
        }
      }
    }

    console.log('Update payload:', updatePayload);

    // Perform update
    const { data: updateRes, error: updateError } = await supabase
      .from('movies')
      .update(updatePayload)
      .eq('id', existing.movie_id)
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      console.log('Update success! Updated rows:', JSON.stringify(updateRes, null, 2));
    }
  } else {
    console.log('No change detected.');
  }
}

main();
