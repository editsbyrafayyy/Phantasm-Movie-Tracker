'use client';

import { useMemo } from 'react';
import { Film, Star, TrendingUp, Calendar, Award, Flame, Eye, Skull } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Entry } from '@/lib/types';

interface WrappedProps {
  entries: Entry[];
  year: number;
}

interface WrappedStat {
  icon:      React.ReactNode;
  label:     string;
  value:     string | number;
  subtext:   string;
  color:     string;
}

function pickQuirk(entries: Entry[]): { value: string; subtext: string } {
  const scored = entries.filter(e => (e.total ?? 0) > 0);
  if (!scored.length) return { value: '—', subtext: 'no rated films' };

  // Film rated below 3 with "Garbage" recommend
  const garbage = scored.filter(e => e.recommend === 'Garbage').sort((a, b) => (a.total ?? 0) - (b.total ?? 0));
  if (garbage[0]) return { value: garbage[0].movie?.title ?? '?', subtext: 'your biggest disappointment' };

  // Otherwise lowest score
  const lowest = scored.sort((a, b) => (a.total ?? 0) - (b.total ?? 0))[0];
  return { value: lowest.movie?.title ?? '?', subtext: `your lowest score (${lowest.total})` };
}

export default function VaultWrapped({ entries, year }: WrappedProps) {
  const thisYear = useMemo(() => entries.filter(e => {
    const d = e.created_at ?? e.updated_at ?? '';
    return d.startsWith(String(year));
  }), [entries, year]);

  const allTime = useMemo(() => entries.filter(e => (e.total ?? 0) > 0), [entries]);

  if (thisYear.length < 3) return null; // not enough data for a "Wrapped" section

  // Compute wrapped stats
  const stats = useMemo((): WrappedStat[] => {
    const rated = thisYear.filter(e => (e.total ?? 0) > 0);
    const totals = rated.map(e => e.total ?? 0);
    const avg = totals.length ? (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1) : '—';

    const topFilm = [...rated].sort((a, b) => (b.total ?? 0) - (a.total ?? 0))[0];
    const topTitle = topFilm?.movie?.title ?? '—';

    const subgenreCounts = new Map<string, number>();
    for (const e of thisYear) {
      const sg = e.subgenre ?? 'Unknown';
      subgenreCounts.set(sg, (subgenreCounts.get(sg) ?? 0) + 1);
    }
    const topGenre = [...subgenreCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    const peakCount    = rated.filter(e => e.recommend === 'Peak').length;
    const garbageCount = rated.filter(e => e.recommend === 'Garbage').length;

    const quirk = pickQuirk(thisYear);

    // Streak: consecutive months with ≥1 entry this year
    const monthsWithEntries = new Set(thisYear.map(e => (e.created_at ?? '').slice(0, 7)));

    // Most productive month
    const monthCounts = new Map<string, number>();
    for (const e of thisYear) {
      const m = (e.created_at ?? '').slice(0, 7);
      if (m) monthCounts.set(m, (monthCounts.get(m) ?? 0) + 1);
    }
    const topMonth = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const monthLabel = topMonth ? new Date(topMonth[0] + '-01').toLocaleDateString('en-US', { month: 'long' }) : '—';

    return [
      {
        icon:    <Film size={18} />,
        label:   'Films Logged',
        value:   thisYear.length,
        subtext: `in ${year}`,
        color:   '#e63232',
      },
      {
        icon:    <Star size={18} />,
        label:   'Avg Score',
        value:   avg,
        subtext: 'out of 10',
        color:   '#f5c518',
      },
      {
        icon:    <Award size={18} />,
        label:   'Best Film',
        value:   topTitle,
        subtext: `${topFilm?.total ?? '—'}/10`,
        color:   '#9b59f5',
      },
      {
        icon:    <TrendingUp size={18} />,
        label:   'Fave Genre',
        value:   topGenre?.[0] ?? '—',
        subtext: `${topGenre?.[1] ?? 0} films`,
        color:   '#52b044',
      },
      {
        icon:    <Flame size={18} />,
        label:   'Peak Films',
        value:   peakCount,
        subtext: 'rated "Peak"',
        color:   '#ff6b6b',
      },
      {
        icon:    <Calendar size={18} />,
        label:   'Busiest Month',
        value:   monthLabel,
        subtext: `${topMonth?.[1] ?? 0} films logged`,
        color:   '#3b82f6',
      },
      {
        icon:    <Eye size={18} />,
        label:   'Active Months',
        value:   monthsWithEntries.size,
        subtext: 'out of 12',
        color:   '#06b6d4',
      },
      {
        icon:    <Skull size={18} />,
        label:   'Skipped',
        value:   quirk.value,
        subtext: quirk.subtext,
        color:   '#6b6b6b',
      },
    ];
  }, [thisYear, year]);

  return (
    <section className="wrapped-section">
      <div className="wrapped-header">
        <div className="wrapped-header-left">
          <span className="wrapped-eyebrow">Year in Review</span>
          <h2 className="wrapped-title">{year} Vault Wrapped</h2>
          <p className="wrapped-sub">
            You logged <strong>{thisYear.length}</strong>{' '}films this year. Here&apos;s how it looked.
          </p>
        </div>
        <Skull size={24} className="wrapped-badge-icon" aria-hidden="true" />
      </div>

      <div className="wrapped-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="wrapped-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="wrapped-card-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="wrapped-card-body">
              <span className="wrapped-card-label">{stat.label}</span>
              <strong
                className="wrapped-card-value"
                style={{ color: stat.color }}
                title={String(stat.value)}
              >
                {stat.value}
              </strong>
              <span className="wrapped-card-sub">{stat.subtext}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
