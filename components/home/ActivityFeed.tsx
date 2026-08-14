import { createServerSupabaseClient } from '@/lib/supabase/server';
import ActivityFeedClient, { ActivityItem } from './ActivityFeedClient';

export default async function ActivityFeed() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('entries')
    .select(`
      id,
      created_at,
      updated_at,
      total,
      recommend,
      subgenre,
      secondary_tag,
      must_watch,
      notes,
      user_id,
      movie:movies(title, poster_url, year),
      profile:profiles(username, display_name, avatar_url)
    `)
    .order('updated_at', { ascending: false })
    .limit(30);

  if (error || !data || data.length === 0) return null;

  // Filter out null profiles (shouldn't happen, but safety)
  const items = (data as unknown as ActivityItem[]).filter(
    d => d.profile && d.movie
  );

  if (!items.length) return null;

  return <ActivityFeedClient items={items} />;
}
