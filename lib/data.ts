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
      .select('*, movie:movies (*)')
      .eq('user_id', OWNER_ID)
      .order('created_at', { ascending: false });

    return ((data ?? []) as unknown) as Entry[];
  },
  ['owner-entries'],
  { revalidate: 300, tags: ['owner-entries'] }
);
