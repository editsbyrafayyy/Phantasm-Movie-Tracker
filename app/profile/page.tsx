import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { OWNER_ID } from '@/lib/guards';
import { computeProfileStats } from '@/lib/profileStats';
import PageHeader      from '@/components/ui/PageHeader';
import CalendarHeatmap from '@/components/stats/CalendarHeatmap';
import ProfileAvatar   from '@/components/profile/ProfileAvatar';
import ProfileEdit     from '@/components/profile/ProfileEdit';
import ExportButton    from '@/components/profile/ExportButton';
import VaultHealthCheckModal from '@/components/profile/VaultHealthCheckModal';
import PasswordReset   from '@/components/profile/PasswordReset';
import SignOutButton   from '@/components/profile/SignOutButton';
import YearCard        from '@/components/profile/stats/YearCard';
import TopTenRow       from '@/components/profile/stats/TopTenRow';
import HotTakes        from '@/components/profile/stats/HotTakes';
import HabitsCard      from '@/components/profile/stats/HabitsCard';
import VerdictBar      from '@/components/profile/stats/VerdictBar';
import { SubgenreCard, CategoryCard, DirectorsCard, DecadesCard } from '@/components/profile/stats/TasteCards';
import type { Entry, Profile } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Profile — Phantasm',
};

// Only the columns the profile stats read.
const ENTRY_FIELDS = [
  'id', 'subgenre', 'recommend', 'total', 'created_at',
  'atmosphere', 'story', 'characters', 'pacing', 'visuals', 'thrill', 'sound', 'impact',
  'movie:movies (title, poster_url, runtime_min, year, director, imdb_rating, media_type)',
].join(', ');

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/profile');
  }

  const [profileResult, entriesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, role, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('entries')
      .select(ENTRY_FIELDS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ]);

  const profile = profileResult.data;
  if (profileResult.error || !profile) {
    redirect('/login');
  }

  const typedProfile = profile as Profile;
  const entries = (entriesResult.data ?? []) as unknown as Entry[];
  // Authorize by OWNER_USER_ID only — profiles.role is user-editable.
  const isOwner = !!OWNER_ID && user.id === OWNER_ID;

  const memberSince = new Date(typedProfile.created_at).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const stats = computeProfileStats(entries);

  const headline = [
    { label: 'Films rated',   value: stats.rated },
    { label: 'Average score', value: stats.rated ? stats.avgScore.toFixed(1) : '—' },
    { label: 'Hours watched', value: stats.hoursWatched.toLocaleString('en-GB') },
    { label: 'Rated Peak',    value: stats.peakCount },
  ];

  return (
    <div className="profile-page page-container">
      <h1 className="sr-only">Profile</h1>

      <section className="profile-hero" aria-label="Account">
        <div className="profile-user-header">
          <ProfileAvatar profile={typedProfile} />
          <div className="profile-info">
            <ProfileEdit profile={typedProfile} />
            <p className="profile-meta">
              <span className="profile-username">@{typedProfile.username}</span>
              <span aria-hidden="true">·</span>
              <span>Since {memberSince}</span>
              {isOwner && <span className="profile-role-badge">Owner</span>}
            </p>
          </div>
          {isOwner && (
            <Link href="/admin" className="btn-secondary profile-admin-link">
              Admin
            </Link>
          )}
        </div>

        {entries.length > 0 && (
          <>
            <dl className="profile-headline">
              {headline.map(h => (
                <div key={h.label} className="profile-headline-item">
                  <dt>{h.label}</dt>
                  <dd>{h.value}</dd>
                </div>
              ))}
            </dl>

            <VerdictBar verdicts={stats.verdicts} />
          </>
        )}
      </section>

      {entries.length > 0 ? (
        <section className="profile-section" aria-label="Statistics">
            <PageHeader as="section" title="Your" accent="taste" eyebrow="Statistics" className="profile-section-head" />
            <div className="profile-grid">
              {stats.year && <YearCard data={stats.year} />}
              <TopTenRow films={stats.topRated} series={stats.topSeries} />
              <SubgenreCard data={stats.subgenres} />
              <CategoryCard data={stats.categories} />
              <HotTakes above={stats.hotTakes.above} below={stats.hotTakes.below} />
              <DirectorsCard data={stats.directors} />
              <DecadesCard data={stats.decades} />
              <HabitsCard pace={stats.pace} runtime={stats.runtime} />
              <CalendarHeatmap year={new Date().getFullYear()} dates={entries.map(e => e.created_at)} />
            </div>
        </section>
      ) : (
        <div className="empty-state">
          <p className="empty-state-title">The vault is silent</p>
          <p className="empty-state-body">Rate a few films and your statistics will show up here.</p>
          <Link href="/add" className="btn-primary">Log a film</Link>
        </div>
      )}

      <section className="profile-section" aria-label="Account settings">
        <PageHeader as="section" title="Account" accent="settings" className="profile-section-head" />
        <div className="profile-settings">
          <div className="profile-settings-col">
            <VaultHealthCheckModal />
            <ExportButton />
            <SignOutButton />
          </div>
          <PasswordReset />
        </div>
      </section>
    </div>
  );
}
