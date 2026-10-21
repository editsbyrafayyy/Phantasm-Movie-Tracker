import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { computeStats } from '@/lib/stats';
import PageHeader      from '@/components/ui/PageHeader';
import SummaryStrip    from '@/components/stats/SummaryStrip';
import GenreDonut      from '@/components/stats/GenreDonut';
import RecommendBars   from '@/components/stats/RecommendBars';
import ScoreHistograms from '@/components/stats/ScoreHistograms';
import TopRatedList    from '@/components/stats/TopRatedList';
import ScoreDistribution from '@/components/stats/ScoreDistribution';
import PhantasmWrapped from '@/components/stats/PhantasmWrapped';
import RatingDriftChart from '@/components/stats/RatingDriftChart';
import TasteFingerprint from '@/components/stats/TasteFingerprint';
import CalendarHeatmap  from '@/components/stats/CalendarHeatmap';
import ProfileAvatar   from '@/components/profile/ProfileAvatar';
import ProfileEdit     from '@/components/profile/ProfileEdit';
import ExportButton    from '@/components/profile/ExportButton';
import VaultHealthCheckModal from '@/components/profile/VaultHealthCheckModal';
import PasswordReset   from '@/components/profile/PasswordReset';
import AdminPanel      from '@/components/profile/AdminPanel';
import SignOutButton   from '@/components/profile/SignOutButton';
import type { Entry, Profile } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Profile — Phantasm',
};

// Only the columns the stats widgets actually read.
const ENTRY_FIELDS = [
  'id', 'subgenre', 'recommend', 'total', 'bonus', 'created_at', 'updated_at',
  'atmosphere', 'story', 'characters', 'pacing', 'visuals', 'thrill', 'sound', 'impact',
  'movie:movies (id, title, poster_url, runtime_min, year)',
].join(', ');

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
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
  const typedEntries = (entriesResult.data ?? []) as unknown as Entry[];

  const isOwner = typedProfile.role === 'owner' || user.id === process.env.OWNER_USER_ID;

  const memberSince = new Date(typedProfile.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const stats = computeStats(typedEntries);
  const year  = new Date().getFullYear();

  return (
    <div className="profile-page page-container">
      <div className="profile-column">
        <PageHeader title="Profile" />

        <div className="profile-card">
          <div className="profile-user-header">
            <ProfileAvatar profile={typedProfile} />

            <div className="profile-info">
              <ProfileEdit profile={typedProfile} />
              <div className="profile-handle-row">
                <p className="profile-username">@{typedProfile.username}</p>
                <p className="profile-meta">
                  Member since {memberSince}
                  {isOwner && <span className="profile-role-badge">Owner</span>}
                </p>
              </div>
            </div>
          </div>

          {isOwner && <AdminPanel />}
        </div>
      </div>

      <section className="profile-stats-section" aria-label="Statistics">
        <PageHeader as="section" title="Statistics" eyebrow="Your vault" />

        {typedEntries.length > 0 ? (
          <>
            <PhantasmWrapped entries={typedEntries} year={year} />

            <SummaryStrip stats={stats} />

            <div className="stats-charts-grid">
              <GenreDonut    data={stats.bySubgenre} />
              <RecommendBars data={stats.byRecommend} />

              <TopRatedList data={stats.topRated} />
              <ScoreDistribution entries={typedEntries} />

              <RatingDriftChart entries={typedEntries} />
              <TasteFingerprint entries={typedEntries} />
              <CalendarHeatmap year={year} dates={typedEntries.map(e => e.created_at)} />

              <ScoreHistograms data={stats.scoresByField} />
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p className="empty-state-title">No stats yet</p>
            <p className="empty-state-body">Rate a few films and your statistics will show up here.</p>
            <Link href="/add" className="btn-primary">Log a film</Link>
          </div>
        )}
      </section>

      <section className="profile-column profile-settings" aria-label="Account">
        <VaultHealthCheckModal />
        <ExportButton />
        <PasswordReset />
        <SignOutButton />
      </section>
    </div>
  );
}
