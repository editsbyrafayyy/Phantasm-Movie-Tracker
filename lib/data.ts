import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import type { Entry } from '@/lib/types';

/**
 * Fetches all entries for the vault owner.
 * Cached for 5 minutes (300 seconds).
 */
export const getOwnerEntries = unstable_cache(
  async (): Promise<Entry[]> => {
    const OWNER_ID = process.env.OWNER_USER_ID;
    if (!OWNER_ID) return [];

    const supabase = createServiceClient();
    const { data } = await supabase
      .from('entries')
      .select(`
        id, user_id, movie_id, created_at,
        total, atmosphere, story, characters, rewatchability, recommend,
        subgenre, review_notes, custom_tags,
        must_watch, watchlist,
        movie:movies (
          id, title, year, runtime_min,
          poster_url, backdrop_url,
          omdb_id, tmdb_id,
          director, cast, plot
        )
      `)
      .eq('user_id', OWNER_ID)
      .order('created_at', { ascending: false });

    return ((data ?? []) as unknown) as Entry[];
  },
  ['owner-entries'],
  { revalidate: 300, tags: ['owner-entries'] }
);
