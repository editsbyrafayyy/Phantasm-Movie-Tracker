import { Suspense } from 'react';
import Link    from 'next/link';
import HeroBackground from '@/components/HeroBackground';
import HeroCarousel   from '@/components/browse/HeroCarousel';
import CategoryRow from '@/components/browse/CategoryRow';
import VaultFilter    from '@/components/home/VaultFilter';
import ComingSoonWidget from '@/components/home/ComingSoonWidget';
import RouletteTrigger from '@/components/home/RouletteTrigger';
import ActivityFeed    from '@/components/home/ActivityFeed';
import OnThisDayWidget from '@/components/home/OnThisDayWidget';
import RecentlyViewedRow from '@/components/home/RecentlyViewedRow';
import PageHeader from '@/components/ui/PageHeader';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getOwnerEntries } from '@/lib/data';
import type { Entry } from '@/lib/types';

const SUBGENRE_ORDER = [
  'Psychological Horror',
  'Supernatural Horror',
  'Slasher',
  'Folk Horror',
  'Creature Feature',
  'Found Footage Horror',
  'Survival Horror',
  'Sci-Fi Horror',
  'Religious/Occult Horror',
  'Zombie Horror',
  'Gore/Extreme Horror',
  'Horror Comedy',
  'Thriller (Non-Horror)',
];

export const metadata = {
  title: 'Phantasm — Horror Film Tracker',
  description: 'A curated collection of horror films, scored across 8 criteria.',
};

export default async function HomePage() {
  // Gracefully handle Supabase connectivity issues
  let user = null;
  let entries: Entry[] = [];

  try {
    const authPromise    = createServerSupabaseClient().then(s => s.auth.getUser());
    const entriesPromise = getOwnerEntries();

    const [authResult, fetchedEntries] = await Promise.all([
      authPromise,
      entriesPromise,
    ]);

    user    = authResult.data.user;
    entries = fetchedEntries;
  } catch {
    // Network unavailable — render with empty data, no crash
  }

  const ownerName = process.env.NEXT_PUBLIC_OWNER_USERNAME ?? 'Rafayyy';

  // Filter entries
  const mustWatchEntries = entries.filter(e => e.must_watch === true);
  const remainingEntries = entries.filter(e => e.must_watch !== true);

  // Top-rated entries with BOTH poster AND backdrop for the hero carousel
  const slides = remainingEntries
    .filter(e => e.movie.backdrop_url && e.movie.poster_url)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 8);

  return (
    <div className="browse-page home-page">
      <HeroBackground />

      <HeroCarousel
        slides={slides}
        canStream={!!user}
        ownerName={ownerName}
        totalFilms={entries.length}
      />

      {!user && (
        <div className="guest-notice-banner">
          <p className="guest-notice-text">
            You&apos;re browsing as a guest — this is {ownerName}&apos;s personal horror collection.
          </p>
          <Link href="/login" className="btn-secondary guest-notice-link">
            Sign in
          </Link>
        </div>
      )}

      {user && (
        <div className="home-on-this-day-wrapper">
          <OnThisDayWidget />
        </div>
      )}

      <RecentlyViewedRow />

      {mustWatchEntries.length > 0 && (
        <CategoryRow label="Must watch" entries={mustWatchEntries} />
      )}

      <Suspense fallback={null}>
        <ComingSoonWidget />
      </Suspense>

      <Suspense fallback={null}>
        <ActivityFeed />
      </Suspense>

      <section className="home-vault-section">
        <div className="home-section-head">
          <PageHeader
            as="section"
            title="From the"
            accent="vault"
            subtitle={`Every film ${ownerName} has scored, grouped by subgenre.`}
            actions={<Suspense fallback={null}><RouletteTrigger entries={entries} canStream={!!user} /></Suspense>}
            className="home-vault-header"
          />
        </div>

        <VaultFilter
          entries={remainingEntries}
          subgenreOrder={SUBGENRE_ORDER}
          ownerName={ownerName}
          canAdd={!!user}
        />
      </section>
    </div>
  );
}
