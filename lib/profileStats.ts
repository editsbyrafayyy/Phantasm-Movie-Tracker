import { SCORE_FIELDS } from '@/lib/config';
import type { Entry } from '@/lib/types';

/**
 * Everything the profile page shows, computed in one place on the server.
 * "Rated" means total > 0 — unrated logs count towards activity, never towards scores.
 */

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

export interface FilmRef {
  id:     string;          // entry id → /vault/<id>
  title:  string;
  poster: string | null;
  year:   number | null;
  total:  number;
}

export interface HotTake extends FilmRef {
  imdb:  number;
  delta: number;           // your score − IMDb
}

export interface ProfileStats {
  rated:        number;
  logged:       number;
  avgScore:     number;
  hoursWatched: number;
  peakCount:    number;
  verdicts:     { label: string; count: number }[];
  year: {
    year:         number;
    logged:       number;
    avgScore:     number | null;
    vsAllTime:    number | null;   // this year's average − all-time average
    busiestMonth: { name: string; count: number } | null;
    activeMonths: number;
    letdown:      FilmRef | null;
  } | null;
  subgenres:  { name: string; count: number; avg: number | null }[];
  categories: { label: string; pct: number; avg: number; max: number }[];
  topRated:   FilmRef[];   // films only
  topSeries:  FilmRef[];   // series ranked separately — never mixed with films
  hotTakes:   { above: HotTake[]; below: HotTake[] };
  directors:  { name: string; count: number; avg: number | null }[];
  decades:    { label: string; count: number; avg: number | null }[];
  pace: {
    thisMonth:     number;
    perMonth:      number;
    weekStreak:    number;
    longestStreak: number;
  };
  runtime: {
    avg:      number | null;
    longest:  (FilmRef & { minutes: number }) | null;
    shortest: (FilmRef & { minutes: number }) | null;
  };
}

function ref(e: Entry): FilmRef {
  return {
    id:     e.id,
    title:  e.movie?.title ?? 'Untitled',
    poster: e.movie?.poster_url ?? null,
    year:   e.movie?.year ?? null,
    total:  e.total ?? 0,
  };
}

/** Monday-based week index since the epoch, from a timestamp's UTC date. */
function weekIndex(ts: string): number {
  const d = new Date(ts);
  const days = Math.floor(d.getTime() / 86_400_000);
  return Math.floor((days + 3) / 7); // 1970-01-01 was a Thursday
}

function groupAvg<K>(entries: Entry[], key: (e: Entry) => K | null) {
  const map = new Map<K, { count: number; scores: number[] }>();
  for (const e of entries) {
    const k = key(e);
    if (k === null) continue;
    const g = map.get(k) ?? { count: 0, scores: [] };
    g.count++;
    if ((e.total ?? 0) > 0) g.scores.push(e.total!);
    map.set(k, g);
  }
  return [...map.entries()].map(([k, g]) => ({
    key: k,
    count: g.count,
    avg: g.scores.length ? round1(avg(g.scores)) : null,
  }));
}

export function computeProfileStats(entries: Entry[], now = new Date()): ProfileStats {
  const rated = entries.filter(e => (e.total ?? 0) > 0);
  const allTimeAvg = avg(rated.map(e => e.total!));

  // ── Headline numbers ────────────────────────────────────────────────────
  const minutes = entries.reduce((s, e) => s + (e.movie?.runtime_min ?? 0), 0);
  const verdicts = ['Peak', 'Yes', 'No', 'Garbage']
    .map(label => ({ label, count: entries.filter(e => e.recommend === label).length }))
    .filter(v => v.count > 0);

  // ── This year ───────────────────────────────────────────────────────────
  const yr = now.getFullYear();
  const thisYear = entries.filter(e => (e.created_at ?? '').startsWith(String(yr)));
  let year: ProfileStats['year'] = null;
  if (thisYear.length >= 3) {
    const yRated = thisYear.filter(e => (e.total ?? 0) > 0);
    const yAvg = yRated.length ? avg(yRated.map(e => e.total!)) : null;
    const months = new Map<number, number>();
    for (const e of thisYear) {
      const m = Number(e.created_at.slice(5, 7)) - 1;
      months.set(m, (months.get(m) ?? 0) + 1);
    }
    const busiest = [...months.entries()].sort((a, b) => b[1] - a[1])[0];
    const lowest = [...yRated].sort((a, b) => (a.total ?? 0) - (b.total ?? 0))[0];
    year = {
      year:         yr,
      logged:       thisYear.length,
      avgScore:     yAvg === null ? null : round1(yAvg),
      vsAllTime:    yAvg === null || !rated.length ? null : round1(yAvg - allTimeAvg),
      busiestMonth: busiest ? { name: MONTH_NAMES[busiest[0]], count: busiest[1] } : null,
      activeMonths: months.size,
      letdown:      lowest ? ref(lowest) : null,
    };
  }

  // ── Taste ───────────────────────────────────────────────────────────────
  const subgenres = groupAvg(entries, e => e.subgenre || null)
    .sort((a, b) => b.count - a.count)
    .map(g => ({ name: g.key, count: g.count, avg: g.avg }));

  const categories = SCORE_FIELDS.map(f => {
    const vals = rated.map(e => Number(e[f.key as keyof Entry] ?? 0));
    const a = avg(vals);
    return { label: f.label, avg: Math.round(a * 100) / 100, max: f.max, pct: Math.round((a / f.max) * 100) };
  }).sort((a, b) => b.pct - a.pct);

  // ── Highlights ──────────────────────────────────────────────────────────
  const byTotal = (a: Entry, b: Entry) => (b.total ?? 0) - (a.total ?? 0);
  const isSeries = (e: Entry) => e.movie?.media_type === 'tv';
  const topRated = rated.filter(e => !isSeries(e)).sort(byTotal).slice(0, 10).map(ref);
  const topSeries = rated.filter(isSeries).sort(byTotal).slice(0, 10).map(ref);

  const takes: HotTake[] = rated
    .filter(e => (e.movie?.imdb_rating ?? 0) > 0)
    .map(e => {
      const imdb = Number(e.movie!.imdb_rating);
      return { ...ref(e), imdb, delta: round1(e.total! - imdb) };
    });
  const hotTakes = {
    above: takes.filter(t => t.delta >= 1).sort((a, b) => b.delta - a.delta).slice(0, 4),
    below: takes.filter(t => t.delta <= -1).sort((a, b) => a.delta - b.delta).slice(0, 4),
  };

  const directors = groupAvg(entries, e => e.movie?.director?.split(',')[0].trim() || null)
    .filter(g => g.count >= 2)
    .sort((a, b) => b.count - a.count || (b.avg ?? 0) - (a.avg ?? 0))
    .slice(0, 6)
    .map(g => ({ name: g.key, count: g.count, avg: g.avg }));

  const decades = groupAvg(entries, e => (e.movie?.year ? Math.floor(e.movie.year / 10) * 10 : null))
    .sort((a, b) => a.key - b.key)
    .map(g => ({ label: `${g.key}s`, count: g.count, avg: g.avg }));

  // ── Pace ────────────────────────────────────────────────────────────────
  const monthKey = `${yr}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = entries.filter(e => (e.created_at ?? '').startsWith(monthKey)).length;
  const first = entries.reduce<string | null>((m, e) => (!m || e.created_at < m ? e.created_at : m), null);
  const monthsSpan = first
    ? Math.max(1, (now.getFullYear() - Number(first.slice(0, 4))) * 12 + now.getMonth() - (Number(first.slice(5, 7)) - 1) + 1)
    : 1;

  const weeks = new Set(entries.filter(e => e.created_at).map(e => weekIndex(e.created_at)));
  const sortedWeeks = [...weeks].sort((a, b) => a - b);
  let longestStreak = 0;
  let run = 0;
  for (let i = 0; i < sortedWeeks.length; i++) {
    run = i > 0 && sortedWeeks[i] === sortedWeeks[i - 1] + 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }
  // Current streak counts back from this week (or last week, so it doesn't reset on Monday).
  const nowWeek = weekIndex(now.toISOString());
  let weekStreak = 0;
  for (let w = weeks.has(nowWeek) ? nowWeek : nowWeek - 1; weeks.has(w); w--) weekStreak++;

  // ── Runtime ─────────────────────────────────────────────────────────────
  const timed = entries.filter(e => (e.movie?.runtime_min ?? 0) > 0);
  const byLength = [...timed].sort((a, b) => b.movie!.runtime_min! - a.movie!.runtime_min!);
  const withMin = (e: Entry | undefined) => (e ? { ...ref(e), minutes: e.movie!.runtime_min! } : null);

  return {
    rated:        rated.length,
    logged:       entries.length,
    avgScore:     round1(allTimeAvg),
    hoursWatched: Math.round(minutes / 60),
    peakCount:    entries.filter(e => e.recommend === 'Peak').length,
    verdicts,
    year,
    subgenres,
    categories,
    topRated,
    topSeries,
    hotTakes,
    directors,
    decades,
    pace: {
      thisMonth,
      perMonth: round1(entries.length / monthsSpan),
      weekStreak,
      longestStreak,
    },
    runtime: {
      avg:      timed.length ? Math.round(avg(timed.map(e => e.movie!.runtime_min!))) : null,
      longest:  withMin(byLength[0]),
      shortest: withMin(byLength[byLength.length - 1]),
    },
  };
}
