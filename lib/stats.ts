import { SCORE_FIELDS, SUBGENRES } from '@/lib/config';
import type { Entry, StatsData } from '@/lib/types';

function round(n: number, dp = 2): number {
  return Math.round(n * 10 ** dp) / 10 ** dp;
}

/**
 * Calculates vault statistics for a set of entries.
 * Ensures unrated films (total === null or total === 0) are excluded
 * from rating calculations (average score, score distribution, rated count).
 */
export function computeStats(entries: Entry[]): StatsData {
  if (!entries || entries.length === 0) {
    return {
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
  }

  // Filter for explicitly rated entries
  const ratedEntries = entries.filter(e => e.total !== null && e.total > 0);
  const ratedTotals = ratedEntries.map(e => e.total!);

  // "Films Rated" reflect count of rated films
  const totalFilms = ratedEntries.length;

  // Total runtime across all logged entries
  const totalRuntimeMin = entries.reduce((acc, e) => acc + (e.movie?.runtime_min ?? 0), 0);

  // Average score calculated ONLY from rated movies (sum of scores ÷ count of rated movies)
  const averageTotal = totalFilms > 0
    ? round(ratedTotals.reduce((a, b) => a + b, 0) / totalFilms)
    : 0;

  // Highest score among rated movies
  const highestScore = ratedEntries.length > 0 ? Math.max(...ratedTotals) : 0;

  // Subgenre counts across all vault entries
  const totalVaultCount = entries.length;
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
      pct:      round((subgenreCounts.get(sg)! / totalVaultCount) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const mostCommonSubgenre = bySubgenre[0]?.subgenre ?? '';

  // Recommendation counts
  const recommendOrder = ['Peak', 'Yes', 'No', 'Garbage'];
  const recCounts = new Map<string, number>();
  for (const e of entries) {
    if (e.recommend) recCounts.set(e.recommend, (recCounts.get(e.recommend) ?? 0) + 1);
  }
  const totalRec = Array.from(recCounts.values()).reduce((a, b) => a + b, 0);
  const byRecommend = recommendOrder
    .filter(r => recCounts.has(r))
    .map(r => ({
      recommend: r,
      count:     recCounts.get(r)!,
      pct:       totalRec > 0 ? round((recCounts.get(r)! / totalRec) * 100) : 0,
    }));

  // Score distributions by field (only from rated entries with positive values)
  const scoresByField = SCORE_FIELDS.map(f => ({
    field:  f.label,
    values: ratedEntries
      .map(e => e[f.key as keyof Entry] as number | null)
      .filter((v): v is number => v !== null && v > 0),
  }));

  // Top rated films (sorted by total score)
  const topRated = [...ratedEntries]
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 10)
    .map(e => ({
      id:     e.id,
      title:  e.movie?.title ?? 'Unknown',
      poster: e.movie?.poster_url ?? null,
      total:  e.total!,
    }));

  // Raw list of scores for rated films
  const scoreDistribution = ratedTotals;

  // Decade breakdown
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
      pct: round((count / totalVaultCount) * 100),
    }))
    .sort((a, b) => a.decade.localeCompare(b.decade));

  return {
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
}
