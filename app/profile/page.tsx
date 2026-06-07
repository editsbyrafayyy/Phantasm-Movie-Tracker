import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SCORE_FIELDS, SUBGENRES } from '@/lib/config';
import SummaryStrip    from '@/components/stats/SummaryStrip';
import GenreDonut      from '@/components/stats/GenreDonut';
import RecommendBars   from '@/components/stats/RecommendBars';
import ScoreHistograms from '@/components/stats/ScoreHistograms';
import TopRatedList    from '@/components/stats/TopRatedList';
import ScoreDistribution from '@/components/stats/ScoreDistribution';
import ProfileEdit     from '@/components/profile/ProfileEdit';
import type { StatsData, Entry, Profile } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Profile — Vault',
};

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Parallelize profile and entries fetching
  const [profileResult, entriesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('entries')
      .select('*, movie:movies (id, title, poster_url)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
  ]);

  const profile = profileResult.data;
  const entries = entriesResult.data;

  if (profileResult.error || !profile) {
    redirect('/login');
  }

  const typedProfile = profile as Profile;
  const typedEntries = (entries ?? []) as Entry[];

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
          {/* Avatar */}
          <div className="profile-avatar" aria-hidden="true">
            {(typedProfile.display_name?.[0] ?? typedProfile.username[0]).toUpperCase()}
          </div>

          <div className="profile-info">
            <p className="profile-username">@{typedProfile.username}</p>
            <p className="profile-meta">
              Member since {memberSince}
              {typedProfile.role === 'owner' && <span className="profile-role-badge">Owner</span>}
            </p>
          </div>

          {/* Edit display name client side form */}
          <ProfileEdit profile={typedProfile} />
        </div>
      </div>

      {/* Embedded Stats Section - expands to 1200px width */}
      {typedEntries.length > 0 ? (
        <div className="profile-stats-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 48, marginTop: 16 }}>
          <header className="form-header" style={{ marginBottom: 32 }}>
            <p className="page-label">Your Vault</p>
            <h1 className="page-title-serif" style={{ fontSize: 'clamp(32px, 5vw, 42px)' }}>Statistics.</h1>
          </header>

          <SummaryStrip stats={stats} />

          <div className="stats-charts-grid">
            {/* Row 1: Genre breakdown (left) + Recommendation breakdown (right) */}
            <GenreDonut    data={stats.bySubgenre} />
            <RecommendBars data={stats.byRecommend} />

            {/* Row 2: Top rated (left) + Score distribution (right) */}
            <TopRatedList data={stats.topRated} />
            <ScoreDistribution entries={typedEntries} />

            {/* Row 3: Score histograms full width */}
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
    </div>
  );
}

function round(n: number, dp = 2) {
  return Math.round(n * 10 ** dp) / 10 ** dp;
}

function computeStats(entries: Entry[]): StatsData {
  if (!entries.length) {
    return {
      totalFilms: 0,
      averageTotal: 0,
      highestScore: 0,
      mostCommonSubgenre: '',
      bySubgenre: [],
      byRecommend: [],
      scoresByField: [],
      topRated: [],
      scoreDistribution: [],
      releaseDecades: [],
    };
  }

  const totals        = entries.map(e => e.total ?? 0);
  const totalFilms    = entries.length;
  const averageTotal  = round(totals.reduce((a, b) => a + b, 0) / totalFilms);
  const highestScore  = Math.max(...totals);

  const subgenreCounts = new Map<string, number>();
  for (const e of entries) {
    const sg = e.subgenre ?? 'Unknown';
    subgenreCounts.set(sg, (subgenreCounts.get(sg) ?? 0) + 1);
  }
  const bySubgenre = SUBGENRES
    .filter(sg => subgenreCounts.has(sg))
    .map(sg => ({ subgenre: sg, count: subgenreCounts.get(sg)!, pct: round((subgenreCounts.get(sg)! / totalFilms) * 100) }))
    .sort((a, b) => b.count - a.count);

  const recCounts = new Map<string, number>();
  for (const e of entries) if (e.recommend) recCounts.set(e.recommend, (recCounts.get(e.recommend) ?? 0) + 1);
  const byRecommend = ['Peak', 'Yes', 'No', 'Garbage']
    .filter(r => recCounts.has(r))
    .map(r => ({ recommend: r, count: recCounts.get(r)!, pct: round((recCounts.get(r)! / totalFilms) * 100) }));

  const scoresByField = SCORE_FIELDS.map(f => ({
    field:  f.label,
    values: entries.map(e => e[f.key as keyof Entry] as number | null).filter((v): v is number => v !== null),
  }));

  const topRated = [...entries]
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 10)
    .map(e => ({ id: e.id, title: e.movie?.title ?? 'Unknown', poster: e.movie?.poster_url ?? null, total: e.total ?? 0 }));

  const scoreDistribution = totals.filter(t => t > 0);

  const decadeCounts = new Map<string, number>();
  for (const e of entries) {
    const year = e.movie?.year ?? null;
    if (!year) continue;
    const decade = Math.floor(year / 10) * 10;
    const label = `${decade}s`;
    decadeCounts.set(label, (decadeCounts.get(label) ?? 0) + 1);
  }

  const releaseDecades = [...decadeCounts.entries()]
    .map(([decade, count]) => ({
      decade,
      count,
      pct: round((count / totalFilms) * 100),
    }))
    .sort((a, b) => a.decade.localeCompare(b.decade));

  return {
    totalFilms,
    averageTotal,
    highestScore,
    mostCommonSubgenre: bySubgenre[0]?.subgenre ?? '',
    bySubgenre,
    byRecommend,
    scoresByField,
    topRated,
    scoreDistribution,
    releaseDecades,
  };
}
