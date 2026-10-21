import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { OWNER_ID } from '@/lib/guards';
import { selectAll } from '@/lib/selectAll';
import PageHeader from '@/components/ui/PageHeader';
import AdminActions from '@/components/admin/AdminActions';
import ResetPasswordForm from '@/components/admin/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Admin — Phantasm',
};

interface MemberRow {
  id: string; username: string; display_name: string | null; role: string; created_at: string;
}
interface EntryRow {
  id: string; user_id: string; movie_id: string; total: number | null; created_at: string;
  movie: { title: string } | null;
}
interface MovieRow {
  id: string; title: string; year: number | null; poster_url: string | null; backdrop_url: string | null;
  runtime_min: number | null; imdb_rating: number | null;
}

const shortDate = (ts: string) =>
  new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const PREVIEW = 6;

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  // Owner only, by OWNER_USER_ID (profiles.role is user-editable). Others get a plain 404.
  if (!OWNER_ID || user.id !== OWNER_ID) notFound();

  // Owner-only page: the service client reads across members for the overview.
  // All writes still go through the owner-gated API routes.
  const service = createServiceClient();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [membersRes, entriesRes, moviesRes, listRes, watchlistRes] = await Promise.all([
    service.from('profiles').select('id, username, display_name, role, created_at').order('created_at'),
    selectAll<EntryRow>((a, b) => service
      .from('entries')
      .select('id, user_id, movie_id, total, created_at, movie:movies (title)')
      .order('created_at', { ascending: false })
      .range(a, b) as unknown as PromiseLike<{ data: EntryRow[] | null; error: unknown }>),
    selectAll<MovieRow>((a, b) => service
      .from('movies')
      .select('id, title, year, poster_url, backdrop_url, runtime_min, imdb_rating')
      .order('title')
      .range(a, b)),
    selectAll<{ movie_id: string }>((a, b) => service.from('list_items').select('movie_id').order('movie_id').range(a, b)),
    service.from('watchlist').select('id', { count: 'exact', head: true }),
  ]);

  const members = (membersRes.data ?? []) as MemberRow[];
  const entries = entriesRes.data;
  const movies = moviesRes.data;

  // ── Members ─────────────────────────────────────────────────────────────
  const byMember = new Map<string, EntryRow[]>();
  for (const e of entries) byMember.set(e.user_id, [...(byMember.get(e.user_id) ?? []), e]);
  const memberStats = members.map(m => {
    const mine = byMember.get(m.id) ?? [];
    const rated = mine.filter(e => (e.total ?? 0) > 0);
    return {
      ...m,
      isOwner: m.id === OWNER_ID,
      logged: mine.length,
      avg: rated.length ? (rated.reduce((s, e) => s + e.total!, 0) / rated.length).toFixed(1) : '—',
      lastActive: mine[0]?.created_at ?? null, // entries are newest first
    };
  });
  const nameOf = new Map(members.map(m => [m.id, m.display_name || m.username]));

  // ── Catalog health ──────────────────────────────────────────────────────
  const entryFor = new Map<string, string>();
  for (const e of entries) {
    // Prefer the owner's entry so "fix" links land on an editable page.
    if (!entryFor.has(e.movie_id) || e.user_id === OWNER_ID) entryFor.set(e.movie_id, e.id);
  }
  const listed = new Set(listRes.data.map(r => r.movie_id));
  const health = [
    { title: 'Missing artwork', items: movies.filter(m => !m.poster_url && !m.backdrop_url) },
    { title: 'Missing year or runtime', items: movies.filter(m => !m.year || !m.runtime_min) },
    { title: 'No IMDb rating', items: movies.filter(m => !m.imdb_rating) },
  ];
  const orphanCount = movies.filter(m => !entryFor.has(m.id) && !listed.has(m.id)).length;

  const overview = [
    { label: 'Members',          value: members.length },
    { label: 'Ratings logged',   value: entries.length },
    { label: 'This month',       value: entries.filter(e => e.created_at >= monthStart).length },
    { label: 'Films in catalog', value: movies.length },
    { label: 'Watch Later saves', value: watchlistRes.count ?? 0 },
  ];

  const loadFailed = !!(membersRes.error || entriesRes.error || moviesRes.error || listRes.error);

  return (
    <div className="admin-page page-container">
      <PageHeader title="Admin" accent="tools" subtitle="Members, catalog health and maintenance." />

      {loadFailed && (
        <p className="field-error admin-error" role="alert">Some data could not be loaded. The numbers below may be incomplete.</p>
      )}

      <dl className="profile-headline admin-overview">
        {overview.map(o => (
          <div key={o.label} className="profile-headline-item">
            <dt>{o.label}</dt>
            <dd>{o.value.toLocaleString('en-GB')}</dd>
          </div>
        ))}
      </dl>

      <div className="admin-grid">
        <section className="stat-card stat-card-wide" aria-labelledby="admin-members">
          <h2 id="admin-members" className="stat-card-label">Members</h2>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col" className="is-num">Films</th>
                  <th scope="col" className="is-num">Avg</th>
                  <th scope="col">Last rated</th>
                  <th scope="col">Joined</th>
                </tr>
              </thead>
              <tbody>
                {memberStats.map(m => (
                  <tr key={m.id}>
                    <td>
                      <span className="admin-member-name">{m.display_name || m.username}</span>
                      <span className="admin-member-handle">
                        @{m.username}
                        {m.isOwner && <span className="profile-role-badge">Owner</span>}
                      </span>
                    </td>
                    <td className="is-num">{m.logged}</td>
                    <td className="is-num">{m.avg}</td>
                    <td>{m.lastActive ? shortDate(m.lastActive) : '—'}</td>
                    <td>{shortDate(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stat-card" aria-labelledby="admin-activity">
          <h2 id="admin-activity" className="stat-card-label">Recent ratings</h2>
          {entries.length ? (
            <ul className="pstat-list">
              {entries.slice(0, 8).map(e => (
                <li key={e.id}>
                  <Link href={`/vault/${e.id}`} className="pstat-film-row">
                    <span className="pstat-film-main">
                      <span className="pstat-film-title">{e.movie?.title ?? 'Untitled'}</span>
                      <span className="pstat-film-sub">{nameOf.get(e.user_id) ?? 'Unknown'} · {shortDate(e.created_at)}</span>
                    </span>
                    <span className="pstat-score">{(e.total ?? 0) > 0 ? e.total : '—'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="settings-desc">Nothing logged yet.</p>
          )}
        </section>

        <section className="stat-card" aria-labelledby="admin-health">
          <h2 id="admin-health" className="stat-card-label">Catalog health</h2>
          {health.every(h => !h.items.length) ? (
            <p className="settings-desc">Every film has artwork, details and an IMDb rating.</p>
          ) : (
            <div className="health-groups">
              {health.filter(h => h.items.length).map(h => (
                <div key={h.title} className="health-group">
                  <h3 className="health-group-title">{h.title} <span className="health-count">{h.items.length}</span></h3>
                  <ul className="health-list">
                    {h.items.slice(0, PREVIEW).map(m => {
                      const entryId = entryFor.get(m.id);
                      const label = <>{m.title}{m.year ? ` (${m.year})` : ''}</>;
                      return (
                        <li key={m.id}>
                          {entryId ? (
                            <Link href={`/vault/${entryId}`} className="health-item">
                              <span className="health-item-title">{label}</span>
                              <span className="health-item-action">Open</span>
                            </Link>
                          ) : (
                            <span className="health-item"><span className="health-item-title">{label}</span></span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {h.items.length > PREVIEW && (
                    <p className="health-more">+ {h.items.length - PREVIEW} more</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="stat-card" aria-labelledby="admin-maint">
          <h2 id="admin-maint" className="stat-card-label">Maintenance</h2>
          <AdminActions orphanCount={orphanCount} />
        </section>

        <section className="stat-card" aria-labelledby="admin-reset">
          <h2 id="admin-reset" className="stat-card-label">Reset a member&rsquo;s password</h2>
          <ResetPasswordForm members={members.filter(m => m.id !== OWNER_ID)} />
        </section>
      </div>
    </div>
  );
}
