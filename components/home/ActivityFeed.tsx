import { createServerSupabaseClient } from '@/lib/supabase/server';
import ActivityFeedClient, { type ActivityItem } from './ActivityFeedClient';

type RawActivity = Omit<ActivityItem, 'href' | 'timeLabel'>;

/** Relative time computed on the server so the client renders the exact same string (no hydration drift). */
function timeAgo(dateStr: string | null | undefined, now: number): string {
  if (!dateStr) return '';
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) return '';
  const diffMs = now - timestamp;
  if (diffMs < 45000) return 'just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diffMs / 86400000);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function toActivityItems(rows: RawActivity[], ownerId: string | undefined, viewerId: string | null): ActivityItem[] {
  const now = Date.now();
  return rows
    .filter(d => d.profile && d.movie)
    .map(d => ({
      ...d,
      href: d.user_id && (d.user_id === ownerId || d.user_id === viewerId) ? `/vault/${d.id}` : null,
      timeLabel: timeAgo(d.updated_at, now),
    }));
}

export default async function ActivityFeed() {
  const supabase = await createServerSupabaseClient();

  const [{ data, error }, { data: auth }] = await Promise.all([
    supabase
      .from('entries')
      .select(`
        id,
        created_at,
        updated_at,
        total,
        recommend,
        subgenre,
        must_watch,
        notes,
        user_id,
        movie:movies(title, poster_url, year),
        profile:profiles(username, display_name, avatar_url)
      `)
      .order('updated_at', { ascending: false })
      .limit(30),
    supabase.auth.getUser(),
  ]);

  if (error || !data || data.length === 0) return null;

  // /vault/[id] only resolves the owner's entries and the viewer's own entries.
  const ownerId = process.env.OWNER_USER_ID;
  const viewerId = auth.user?.id ?? null;
  const items = toActivityItems(data as unknown as RawActivity[], ownerId, viewerId);

  if (!items.length) return null;

  return <ActivityFeedClient items={items} />;
}

/** Streaming fallback: header + five fixed-height rows, matching ActivityFeedClient. */
export function ActivityFeedSkeleton() {
  return (
    <section className="activity-section" aria-hidden="true">
      <div className="page-header page-header-section">
        <div className="page-header-text">
          <div className="skeleton skel-page-eyebrow" />
          <div className="skeleton skel-section-title" />
        </div>
      </div>
      <div className="activity-feed">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="activity-item is-static">
            <div className="skeleton activity-avatar" />
            <div className="skeleton activity-poster" />
            <div className="activity-text">
              <div className="skeleton skel-activity-line" />
              <div className="skeleton skel-activity-badges" />
            </div>
          </div>
        ))}
      </div>
      <div className="activity-show-more-placeholder" />
    </section>
  );
}
