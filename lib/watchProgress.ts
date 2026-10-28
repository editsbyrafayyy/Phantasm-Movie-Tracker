import type { SupabaseClient } from '@supabase/supabase-js';

/** One "Continue watching" title — the same shape the player's localStorage history uses. */
export interface HistoryEntry {
  id: string;           // tmdbId || imdbId (the player route id)
  title: string;
  poster_url: string | null;
  type: string;         // 'movie' | 'tv'
  watchedAt: number;
  progress?: number;    // 0-100
  currentTime?: number; // seconds
  duration?: number;    // seconds
  completed?: boolean;
  season?: number;      // tv: last episode played
  episode?: number;
}

const TTL_DAYS = 30;

interface ProgressRow {
  media_id: string; media_type: string; title: string; poster_url: string | null;
  progress: number | null; position_s: number | null; duration_s: number | null;
  season: number | null; episode: number | null; completed: boolean; updated_at: string;
}

/**
 * The user's recent titles from watch_progress (RLS: own rows), newest first.
 * Returns null when the table can't be read (e.g. the v8 migration hasn't run yet).
 */
export async function loadWatchProgress(supabase: SupabaseClient, userId: string): Promise<HistoryEntry[] | null> {
  const cutoff = new Date(Date.now() - TTL_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('watch_progress')
    .select('media_id, media_type, title, poster_url, progress, position_s, duration_s, season, episode, completed, updated_at')
    .eq('user_id', userId)
    .gte('updated_at', cutoff)
    .order('updated_at', { ascending: false })
    .limit(40);
  if (error) return null;

  return ((data ?? []) as ProgressRow[]).map(r => ({
    id: r.media_id,
    title: r.title,
    poster_url: r.poster_url,
    type: r.media_type,
    watchedAt: new Date(r.updated_at).getTime(),
    progress: r.progress ?? undefined,
    currentTime: r.position_s ?? undefined,
    duration: r.duration_s ?? undefined,
    completed: r.completed,
    season: r.season ?? undefined,
    episode: r.episode ?? undefined,
  }));
}
