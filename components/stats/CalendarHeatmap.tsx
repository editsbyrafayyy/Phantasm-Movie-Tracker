const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** YYYY-MM-DD calendar day of a timestamp (rendered on the server, so server time zone). */
function localIso(ts: string): string | null {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildHeatmapGrid(dates: string[], year: number) {
  // Count ratings per day
  const countByDate: Record<string, number> = {};
  for (const ts of dates) {
    const d = localIso(ts);
    if (!d) continue;
    if (d.startsWith(String(year))) countByDate[d] = (countByDate[d] ?? 0) + 1;
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
  const totalRated = Object.values(countByDate).reduce((sum, v) => sum + v, 0);
  const activeDays = Object.keys(countByDate).length;

  return { weeks, monthLabels, maxCount, totalRated, activeDays };
}

function cellColor(count: number, max: number): string {
  if (count < 0) return 'transparent';
  if (count === 0) return 'rgba(255,255,255,0.04)';
  const intensity = Math.min(count / Math.max(max, 3), 1);
  const alpha = 0.2 + intensity * 0.8;
  return `rgba(230,50,50,${alpha.toFixed(2)})`;
}

const LEGEND_STEPS = [0, 0.25, 0.5, 0.75, 1];

/**
 * Rating activity for one year, built from the vault entries' created_at dates
 * (the profile page already has them, so nothing is fetched here).
 */
export default function CalendarHeatmap({ dates, year }: { dates: string[]; year: number }) {
  const { weeks, monthLabels, maxCount, totalRated, activeDays } = buildHeatmapGrid(dates, year);

  return (
    <div className="stat-card stat-card-wide heatmap-card">
      <div className="heatmap-head">
        <div>
          <h3 className="stat-card-label">Rating activity in {year}</h3>
          <p className="stat-card-desc">
            {totalRated > 0 ? (
              <><strong>{totalRated}</strong> film{totalRated !== 1 ? 's' : ''} rated across <strong>{activeDays}</strong> day{activeDays !== 1 ? 's' : ''} this year.</>
            ) : (
              <>Nothing rated in {year} yet.</>
            )}
          </p>
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

      <div className="heatmap-scroll">
        <div className="heatmap-grid" role="img" aria-label={`Rating activity calendar for ${year}`}>
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
                    title={cell.count > 0 ? `${cell.iso}: ${cell.count} rated` : cell.iso}
                    style={{ background: cellColor(cell.count, maxCount) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
