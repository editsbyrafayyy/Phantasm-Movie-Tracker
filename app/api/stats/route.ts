import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';
import { SCORE_FIELDS, SUBGENRES } from '@/lib/config';
import type { StatsData, Entry } from '@/lib/types';

// Stats are user-specific and can tolerate 30s staleness.
// SWR allows a stale response for up to 5 min while Next revalidates.
const STATS_CACHE = 'private, max-age=30, stale-while-revalidate=300';

/**
 * GET /api/stats
 * Returns aggregated statistics for the authenticated user.
 * All computation is done in JS after a single DB fetch to keep the
 * Supabase query simple and avoid complex SQL aggregations.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: entries, error } = await supabase
    .from('entries')
    .select('*, movie:movies (id, title, poster_url, runtime_min)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('GET /api/stats error', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  if (!entries || entries.length === 0) {
    const empty: StatsData = {
      totalFilms:          0,
      totalRuntimeMin:     0,
      averageTotal:        0,
      highestScore:        0,
      mostCommonSubgenre:  '',
      bySubgenre:          [],
      byRecommend:         [],
      scoresByField:       [],
      topRated:            [],
      scoreDistribution:   [],
      releaseDecades:      [],
    };
    return NextResponse.json(empty, { headers: { 'Cache-Control': STATS_CACHE } });
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const totals = entries.map(e => e.total ?? 0);
  const totalFilms  = entries.length;
  const averageTotal = round(totals.reduce((a, b) => a + b, 0) / totalFilms);
  const highestScore = Math.max(...totals);
  const totalRuntimeMin = entries.reduce((acc, e) => acc + (e.movie?.runtime_min ?? 0), 0);

  // ── By subgenre ────────────────────────────────────────────────────────────
  const subgenreCounts = new Map<string, number>();
  for (const e of entries) {
    const sg = e.subgenre ?? 'Unknown';
    subgenreCounts.set(sg, (subgenreCounts.get(sg) ?? 0) + 1);
  }

  const bySubgenre = SUBGENRES
    .filter(sg => subgenreCounts.has(sg))
    .map(sg => ({
      subgenre: sg,
      count:    subgenreCounts.get(sg)!,
      pct:      round((subgenreCounts.get(sg)! / totalFilms) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const mostCommonSubgenre = bySubgenre[0]?.subgenre ?? '';

  // ── By recommend ──────────────────────────────────────────────────────────
  const recommendOrder = ['Peak', 'Yes', 'No', 'Garbage'];
  const recCounts = new Map<string, number>();
  for (const e of entries) {
    if (e.recommend) recCounts.set(e.recommend, (recCounts.get(e.recommend) ?? 0) + 1);
  }
  const byRecommend = recommendOrder
    .filter(r => recCounts.has(r))
    .map(r => ({
      recommend: r,
      count:     recCounts.get(r)!,
      pct:       round((recCounts.get(r)! / totalFilms) * 100),
    }));

  // ── Score histograms ──────────────────────────────────────────────────────
  const scoresByField = SCORE_FIELDS.map(f => ({
    field:  f.label,
    values: entries
      .map(e => e[f.key as keyof typeof e] as number | null)
      .filter((v): v is number => v !== null),
  }));

  // ── Top rated ────────────────────────────────────────────────────────────
  const topRated = [...entries]
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 10)
    .map(e => ({
      id:     e.id,
      title:  (e as Entry & { movie: { title: string; poster_url: string | null } }).movie?.title ?? 'Unknown',
      poster: (e as Entry & { movie: { title: string; poster_url: string | null } }).movie?.poster_url ?? null,
      total:  e.total ?? 0,
    }));

  // ── Score distribution ───────────────────────────────────────────────────
  const scoreDistribution = totals.filter(t => t > 0);

  // ── Release decades ──────────────────────────────────────────────────────
  const decadeCounts = new Map<string, number>();
  for (const e of entries) {
    const year = (e as Entry & { movie?: { year?: number | null } | null }).movie?.year ?? null;
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

  const stats: StatsData = {
    totalFilms,
    totalRuntimeMin,
    averageTotal,
    highestScore,
    mostCommonSubgenre,
    bySubgenre,
    byRecommend,
    scoresByField,
    topRated,
    scoreDistribution,
    releaseDecades,
  };

  return NextResponse.json(stats, { headers: { 'Cache-Control': STATS_CACHE } });
}

function round(n: number, dp = 2): number {
  return Math.round(n * 10 ** dp) / 10 ** dp;
}
