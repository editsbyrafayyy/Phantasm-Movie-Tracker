'use client';

import { useState, useEffect, useMemo } from 'react';

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
  let cursor = new Date(startDate);

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

export default function CalendarHeatmap() {
  const year = new Date().getFullYear();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch this year's entries — year filter handled server-side
    fetch(`/api/diary?year=${year}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.diary)) setEntries(data.diary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  const { weeks, monthLabels, maxCount, totalWatches, activeDays } = useMemo(
    () => buildHeatmapGrid(entries, year),
    [entries, year]
  );

  const CELL = 12;
  const GAP = 3;

  return (
    <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <div>
          <p className="stat-card-label" style={{ marginBottom: 4 }}>Watch Activity — {year}</p>
          {!loading && totalWatches > 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
              <strong style={{ color: 'var(--text)' }}>{totalWatches}</strong> watches logged across{' '}
              <strong style={{ color: 'var(--text)' }}>{activeDays}</strong> days this year
            </p>
          )}
          {!loading && totalWatches === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
              No watches logged yet — use "Log Film" to track your viewings.
            </p>
          )}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <div key={v} style={{
              width: CELL, height: CELL, borderRadius: 2,
              background: v === 0 ? 'rgba(255,255,255,0.04)' : `rgba(230,50,50,${0.2 + v * 0.8})`,
            }} />
          ))}
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>More</span>
        </div>
      </div>

      {loading ? (
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Loading…</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>
            {/* Month labels row */}
            <div style={{ display: 'flex', marginLeft: 28, marginBottom: 4 }}>
              {weeks.map((_, wi) => {
                const label = monthLabels.find(ml => ml.weekIdx === wi);
                return (
                  <div key={wi} style={{ width: CELL + GAP, flexShrink: 0 }}>
                    {label && (
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {MONTHS[label.month]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day rows */}
            {[0,1,2,3,4,5,6].map(dayIdx => (
              <div key={dayIdx} style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: GAP }}>
                {/* Day label */}
                <div style={{ width: 24, flexShrink: 0, textAlign: 'right', paddingRight: 4 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{DAYS[dayIdx]}</span>
                </div>
                {/* Cells */}
                {weeks.map((week, wi) => {
                  const cell = week[dayIdx];
                  return (
                    <div
                      key={wi}
                      title={cell.count > 0 ? `${cell.iso}: ${cell.count} watch${cell.count !== 1 ? 'es' : ''}` : cell.iso}
                      style={{
                        width: CELL,
                        height: CELL,
                        marginRight: GAP,
                        borderRadius: 2,
                        background: cellColor(cell.count, maxCount),
                        flexShrink: 0,
                        cursor: cell.count > 0 ? 'default' : 'default',
                        transition: 'opacity 0.15s',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
