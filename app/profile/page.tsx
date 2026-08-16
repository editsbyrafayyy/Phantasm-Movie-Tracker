import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { computeStats } from '@/lib/stats';
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

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Parallelize profile and entries fetching
  const [profileResult, entriesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('entries')
      .select('*, movie:movies (id, title, poster_url, runtime_min, year)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
  ]);

  const profile = profileResult.data;
  const entries = entriesResult.data;

  if (profileResult.error || !profile) {
    redirect('/login');
  }

  const typedProfile = profile as Profile;
  const typedEntries = (entries ?? []) as Entry[];
  
  const isOwner = typedProfile.role === 'owner' || user.id === process.env.OWNER_USER_ID;

  const memberSince = new Date(typedProfile.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const stats = computeStats(typedEntries);

  return (
    <div className="profile-page page-container profile-bg-glow" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Profile Details Card - centered & constrained to 560px for a clean layout */}
      <div style={{ maxWidth: 560, margin: '0 auto 48px auto' }}>
        <header className="form-header">
          <p className="page-label">Your</p>
          <h1 className="page-title-serif">Profile.</h1>
        </header>

        <div className="profile-card">
          <div className="profile-user-header">
            {/* Interactive Avatar Picker */}
            <ProfileAvatar profile={typedProfile} />

            <div className="profile-info" style={{ marginBottom: 0 }}>
              {/* Edit display name client side form - now acts as the main H2 header */}
              <ProfileEdit profile={typedProfile} />

              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <p className="profile-username" style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 500, margin: 0 }}>
                  @{typedProfile.username}
                </p>
                <p className="profile-meta" style={{ margin: 0 }}>
                  Member since {memberSince}
                  {isOwner && <span className="profile-role-badge">Owner</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Admin panel for owner */}
          {isOwner && <AdminPanel />}
        </div>
      </div>

      {/* Embedded Stats Section - expands to 1200px width */}
      {typedEntries.length > 0 ? (
        <div className="profile-stats-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 48, marginTop: 16 }}>
          <header className="form-header" style={{ marginBottom: 32 }}>
            <p className="page-label">Your Vault</p>
            <h1 className="page-title-serif" style={{ fontSize: 'clamp(32px, 5vw, 42px)' }}>Statistics.</h1>
          </header>

          <PhantasmWrapped entries={typedEntries} year={new Date().getFullYear()} />

          <SummaryStrip stats={stats} />

          <div className="stats-charts-grid">
              {/* Row 1: Genre breakdown (left) + Recommendation breakdown (right) */}
              <GenreDonut    data={stats.bySubgenre} />
              <RecommendBars data={stats.byRecommend} />

              {/* Row 2: Top rated (left) + Score distribution (right) */}
              <TopRatedList data={stats.topRated} />
              <ScoreDistribution entries={typedEntries} />

              {/* Row 3: Rating Drift Chart — full width */}
              <RatingDriftChart entries={typedEntries} />

              {/* Row 4: Personal Taste Fingerprint — full width */}
              <TasteFingerprint entries={typedEntries} />

              {/* Row 5: Calendar Heatmap — full width */}
              <CalendarHeatmap />

              {/* Row 6: Score histograms full width */}
              <div className="stats-histograms-full">
                <ScoreHistograms data={stats.scoresByField} />
              </div>
            </div>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Rate horror films in your vault to unlock statistics.</p>
        </div>
      )}

      {/* Export, Health Check & Profile Settings */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40, marginTop: 48, maxWidth: 560, margin: '0 auto' }}>
        <VaultHealthCheckModal />
        <ExportButton />
        <PasswordReset />
        <SignOutButton />
      </div>
    </div>
  );
}
