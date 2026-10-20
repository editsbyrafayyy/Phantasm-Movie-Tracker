'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface DiaryEntry {
  id: string;
  watched_at: string; // 'YYYY-MM-DD'
}

const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildHeatmapGrid(entries: DiaryEntry[], year: number) {
  // Count watches per date
  const countByDate: Record<string, number> = {};
  for (const e of entries) {
    const d = e.watched_at?.slice(0, 10);
    if (!d) continue;
    countByDate[d] = (countByDate[d] ?? 0) + 1;
  }

  // Build 53-week grid starting from the first Monday on/before Jan 1
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay(); // 0=Sun
  // Offset so week starts on Monday (Mon=0)
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startDate = new Date(year, 0, 1 - offset);

  const weeks: { date: Date; count: number; iso: string }[][] = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < 53; w++) {
    const week: { date: Date; count: number; iso: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;
      week.push({
        date: new Date(cursor),
        count: cursor.getFullYear() === year ? (countByDate[iso] ?? 0) : -1, // -1 = out of year
        iso,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor.getFullYear() > year && cursor.getMonth() > 0) break;
  }

  // Month label positions (which week does each month start?)
  const monthLabels: { month: number; weekIdx: number }[] = [];
  for (let w = 0; w < weeks.length; w++) {
    const firstDay = weeks[w][0];
    if (firstDay.date.getDate() <= 7 && firstDay.date.getFullYear() === year) {
      const m = firstDay.date.getMonth();
      if (!monthLabels.find(ml => ml.month === m)) {
        monthLabels.push({ month: m, weekIdx: w });
      }
    }
  }

  const maxCount = Math.max(...Object.values(countByDate), 1);
  const totalWatches = Object.values(countByDate).reduce((s, v) => s + v, 0);
  const activeDays = Object.keys(countByDate).filter(d => d.startsWith(String(year))).length;

  return { weeks, monthLabels, maxCount, totalWatches, activeDays };
}

function cellColor(count: number, max: number): string {
  if (count < 0) return 'transparent';
  if (count === 0) return 'rgba(255,255,255,0.04)';
  const intensity = Math.min(count / Math.max(max, 3), 1);
  const alpha = 0.2 + intensity * 0.8;
  return `rgba(230,50,50,${alpha.toFixed(2)})`;
}

const LEGEND_STEPS = [0, 0.25, 0.5, 0.75, 1];

export default function CalendarHeatmap({ year }: { year: number }) {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; entries: DiaryEntry[] }>({
    status: 'loading',
    entries: [],
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/diary?year=${year}`, { signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        setState({ status: 'ready', entries: Array.isArray(data?.diary) ? data.diary : [] });
      })
      .catch(err => {
        if ((err as Error)?.name !== 'AbortError') setState({ status: 'error', entries: [] });
      });
    return () => controller.abort();
  }, [year]);

  const { weeks, monthLabels, maxCount, totalWatches, activeDays } = useMemo(
    () => buildHeatmapGrid(state.entries, year),
    [state.entries, year],
  );

  return (
    <div className="stat-card stat-card-wide heatmap-card">
      <div className="heatmap-head">
        <div>
          <h3 className="stat-card-label">Watch activity — {year}</h3>
          {state.status === 'ready' && totalWatches > 0 && (
            <p className="stat-card-desc">
              <strong>{totalWatches}</strong> watches across <strong>{activeDays}</strong> days this year.
            </p>
          )}
          {state.status === 'ready' && totalWatches === 0 && (
            <p className="stat-card-desc">
              No watches logged yet. Log a viewing from any film page, or <Link href="/diary">open your diary</Link>.
            </p>
          )}
          {state.status === 'error' && (
            <p className="stat-card-desc">Could not load watch activity.</p>
          )}
        </div>
        <div className="heatmap-legend" aria-hidden="true">
          <span>Less</span>
          {LEGEND_STEPS.map(v => (
            <span
              key={v}
              className="heatmap-cell"
              style={{ background: v === 0 ? 'rgba(255,255,255,0.04)' : `rgba(230,50,50,${0.2 + v * 0.8})` }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {state.status === 'loading' ? (
        <div className="heatmap-loading" role="status">Loading…</div>
      ) : state.status === 'ready' ? (
        <div className="heatmap-scroll">
          <div className="heatmap-grid" role="img" aria-label={`Watch activity calendar for ${year}`}>
            <div className="heatmap-months">
              {weeks.map((_, wi) => {
                const label = monthLabels.find(ml => ml.weekIdx === wi);
                return (
                  <span key={wi} className="heatmap-week-slot">
                    {label ? MONTHS[label.month] : ''}
                  </span>
                );
              })}
            </div>

            {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
              <div key={dayIdx} className="heatmap-row">
                <span className="heatmap-day">{DAYS[dayIdx]}</span>
                {weeks.map((week, wi) => {
                  const cell = week[dayIdx];
                  return (
                    <span
                      key={wi}
                      className="heatmap-cell"
                      title={cell.count > 0 ? `${cell.iso}: ${cell.count} watch${cell.count !== 1 ? 'es' : ''}` : cell.iso}
                      style={{ background: cellColor(cell.count, maxCount) }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
