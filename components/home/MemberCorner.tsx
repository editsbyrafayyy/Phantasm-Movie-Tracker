import Link from 'next/link';
import CategoryRow from '@/components/browse/CategoryRow';
import WatchHistoryRow from '@/components/stream/WatchHistoryRow';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadWatchProgress } from '@/lib/watchProgress';
import type { Entry } from '@/lib/types';

const RECENT = 12;

/**
 * A signed-in member's own corner above the owner's showcase: what they were
 * watching and what they logged last. Loaded on the server so the rows are in
 * place on first paint (no pop-in shifting the page).
 */
export default async function MemberCorner({ userId }: { userId: string }) {
  const supabase = await createServerSupabaseClient();
  const [progress, { data }] = await Promise.all([
    loadWatchProgress(supabase, userId),
    supabase
      .from('entries')
      .select('id, user_id, movie_id, subgenre, recommend, total, must_watch, created_at, movie:movies (id, title, year, poster_url, backdrop_url, omdb_id, tmdb_id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  const entries = (data ?? []) as unknown as Entry[];
  const rated = new Set<string>();
  for (const e of entries) {
    if (e.movie?.omdb_id) rated.add(e.movie.omdb_id);
    if (e.movie?.tmdb_id) rated.add(String(e.movie.tmdb_id));
  }
  const continueItems = (progress ?? []).filter(p => !rated.has(p.id));

  return (
    <section className="member-corner" aria-label="Your corner">
      <div className="member-corner-continue">
        <WatchHistoryRow initial={continueItems} />
      </div>
      {entries.length > 0 ? (
        <CategoryRow label="Your recent logs" entries={entries.slice(0, RECENT)} />
      ) : (
        <p className="member-corner-empty">
          Your vault is empty. <Link href="/add">Log your first film</Link> or find something on <Link href="/stream">Stream</Link>.
        </p>
      )}
    </section>
  );
}
