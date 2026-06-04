import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SCORE_FIELDS, SUBGENRES } from '@/lib/config';
import type { StatsData, Entry } from '@/lib/types';

/**
 * GET /api/stats
 * Returns aggregated statistics for the authenticated user.
 * All computation is done in JS after a single DB fetch to keep the
 * Supabase query simple and avoid complex SQL aggregations.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: entries, error } = await supabase
    .from('entries')
    .select('*, movie:movies (id, title, poster_url)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('GET /api/stats error', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  if (!entries || entries.length === 0) {
    const empty: StatsData = {
      totalFilms:          0,
      averageTotal:        0,
      highestScore:        0,
      mostCommonSubgenre:  '',
      bySubgenre:          [],
      byRecommend:         [],
      scoresByField:       [],
      topRated:            [],
      ratingOverTime:      [],
    };
    return NextResponse.json(empty);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const totals = entries.map(e => e.total ?? 0);
  const totalFilms  = entries.length;
  const averageTotal = round(totals.reduce((a, b) => a + b, 0) / totalFilms);
  const highestScore = Math.max(...totals);

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

  // ── Rating over time ──────────────────────────────────────────────────────
  const ratingOverTime = entries.map(e => ({
    date:  e.created_at.slice(0, 10),   // ISO date YYYY-MM-DD
    total: e.total ?? 0,
    title: (e as Entry & { movie: { title: string } }).movie?.title ?? 'Unknown',
  }));

  const stats: StatsData = {
    totalFilms,
    averageTotal,
    highestScore,
    mostCommonSubgenre,
    bySubgenre,
    byRecommend,
    scoresByField,
    topRated,
    ratingOverTime,
  };

  return NextResponse.json(stats);
}

function round(n: number, dp = 2): number {
  return Math.round(n * 10 ** dp) / 10 ** dp;
}
