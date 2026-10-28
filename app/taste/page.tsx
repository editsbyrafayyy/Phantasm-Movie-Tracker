import type { Metadata } from 'next';
import { getOwnerEntries } from '@/lib/data';
import { computeProfileStats } from '@/lib/profileStats';
import PageHeader      from '@/components/ui/PageHeader';
import CalendarHeatmap from '@/components/stats/CalendarHeatmap';
import YearCard        from '@/components/profile/stats/YearCard';
import TopTenRow       from '@/components/profile/stats/TopTenRow';
import HotTakes        from '@/components/profile/stats/HotTakes';
import HabitsCard      from '@/components/profile/stats/HabitsCard';
import VerdictBar      from '@/components/profile/stats/VerdictBar';
import ScoreGuide      from '@/components/vault/detail/ScoreGuide';
import DareSection     from '@/components/home/DareSection';
import { SubgenreCard, CategoryCard, DirectorsCard, DecadesCard } from '@/components/profile/stats/TasteCards';
import type { Entry } from '@/lib/types';

const OWNER = process.env.NEXT_PUBLIC_OWNER_USERNAME ?? 'Rafayyy';

// Stats follow the owner's cache tag; this keeps "Most dared" fresh too.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `${OWNER}’s taste — Phantasm`,
  description: `How ${OWNER} rates horror: top 10, favourite subgenres, hot takes against IMDb and more.`,
};

/** Public read-only stats for the owner's collection — the profile page's stats, for everyone. */
export default async function TastePage() {
  const entries = (await getOwnerEntries()) as unknown as Entry[];
  const stats = computeProfileStats(entries);

  const headline = [
    { label: 'Films in the vault', value: stats.logged },
    { label: 'Average score', value: stats.rated ? stats.avgScore.toFixed(1) : '—' },
    { label: 'Hours watched', value: stats.hoursWatched.toLocaleString('en-GB') },
    { label: 'Rated Peak',    value: stats.peakCount },
  ];

  return (
    <div className="profile-page page-container taste-page">
      <PageHeader
        title={`${OWNER}’s`}
        accent="taste"
        eyebrow="The curator"
        subtitle={`Every number here comes from ${OWNER}’s own ratings — what lands, what doesn’t, and where the internet gets it wrong.`}
      />

      {entries.length > 0 ? (
        <>
          <section className="profile-hero taste-hero" aria-label="At a glance">
            <dl className="profile-headline">
              {headline.map(h => (
                <div key={h.label} className="profile-headline-item">
                  <dt>{h.label}</dt>
                  <dd>{h.value}</dd>
                </div>
              ))}
            </dl>
            <VerdictBar verdicts={stats.verdicts} />
          </section>

          <section className="profile-section" aria-label="Statistics">
            <div className="profile-grid">
              <TopTenRow films={stats.topRated} who={OWNER} />
              <HotTakes above={stats.hotTakes.above} below={stats.hotTakes.below} who={OWNER} />
              <SubgenreCard data={stats.subgenres} />
              <CategoryCard data={stats.categories} who={OWNER} />
              <DirectorsCard data={stats.directors} who={OWNER} />
              <DecadesCard data={stats.decades} />
              {stats.year && <YearCard data={stats.year} />}
              <HabitsCard pace={stats.pace} runtime={stats.runtime} />
              <section className="stat-card" aria-labelledby="taste-scoring">
                <h3 id="taste-scoring" className="stat-card-label">How the scoring works</h3>
                <ScoreGuide />
              </section>
              <CalendarHeatmap year={new Date().getFullYear()} dates={entries.map(e => e.created_at)} />
            </div>
          </section>
        </>
      ) : (
        <div className="empty-state">
          <p className="empty-state-title">The vault is silent</p>
          <p className="empty-state-body">Nothing has been rated yet.</p>
        </div>
      )}

      <DareSection />
    </div>
  );
}
