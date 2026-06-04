import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SCORE_FIELDS, SUBGENRES } from '@/lib/config';
import SummaryStrip    from '@/components/stats/SummaryStrip';
import GenreDonut      from '@/components/stats/GenreDonut';
import RecommendBars   from '@/components/stats/RecommendBars';
import ScoreHistograms from '@/components/stats/ScoreHistograms';
import TopRatedList    from '@/components/stats/TopRatedList';
import ScoreDistribution from '@/components/stats/ScoreDistribution';
import type { StatsData, Entry } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Stats — Vault',
};

export default async function StatsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: entries, error } = await supabase
    .from('entries')
    .select('*, movie:movies (id, title, poster_url)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true });

  if (error || !entries) {
    return (
      <div className="page-container">
        <p className="form-error-state">Could not load stats. Try refreshing.</p>
      </div>
    );
  }

  const stats = computeStats(entries as Entry[]);

  return (
    <div className="stats-page page-container">
      <header className="form-header">
        <p className="page-label">Your</p>
        <h1 className="page-title-serif">Stats.</h1>
      </header>

      <SummaryStrip stats={stats} />

      <div className="stats-charts-grid">
        {/* Row 1: Genre breakdown (large left) + Recommendation breakdown (right) */}
        <GenreDonut    data={stats.bySubgenre} />
        <RecommendBars data={stats.byRecommend} />

        {/* Row 2: Top rated (left) + Score distribution (right) */}
        <TopRatedList data={stats.topRated} />
        <ScoreDistribution entries={entries as Entry[]} />

        {/* Row 3: Score histograms full width */}
        <div className="stats-histograms-full">
          <ScoreHistograms data={stats.scoresByField} />
        </div>
      </div>
    </div>
  );
}

function round(n: number, dp = 2) {
  return Math.round(n * 10 ** dp) / 10 ** dp;
}

function computeStats(entries: Entry[]): StatsData {
  if (!entries.length) {
    return {
      totalFilms: 0, averageTotal: 0, highestScore: 0,
      mostCommonSubgenre: '', bySubgenre: [], byRecommend: [],
      scoresByField: [], topRated: [], scoreDistribution: [], releaseDecades: [],
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
    totalFilms, averageTotal, highestScore,
    mostCommonSubgenre: bySubgenre[0]?.subgenre ?? '',
    bySubgenre, byRecommend, scoresByField, topRated, scoreDistribution, releaseDecades,
  };
}
