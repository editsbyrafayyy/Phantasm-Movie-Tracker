import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link    from 'next/link';
import HeroBackground from '@/components/HeroBackground';
import HeroCarousel   from '@/components/browse/HeroCarousel';
import CategoryRow from '@/components/browse/CategoryRow';
import VaultFilter    from '@/components/home/VaultFilter';
import ComingSoonWidget from '@/components/home/ComingSoonWidget';
import RouletteTrigger from '@/components/home/RouletteTrigger';
import ActivityFeed, { ActivityFeedSkeleton } from '@/components/home/ActivityFeed';
import RecentlyViewedRow, { RECENT_HINT_COOKIE } from '@/components/home/RecentlyViewedRow';
import MemberCorner from '@/components/home/MemberCorner';
import DareSection from '@/components/home/DareSection';
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
  description: 'My horror movie tracker. Every film I have watched, scored across eight categories, plus a place for my friends to log theirs.',
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
  // Set by RecentlyViewedRow when this browser has history: reserve the row's space.
  const hasRecent = (await cookies()).get(RECENT_HINT_COOKIE)?.value === '1';

  // Filter entries
  const mustWatchEntries = entries.filter(e => e.must_watch === true);
  const remainingEntries = entries.filter(e => e.must_watch !== true);

  const byScore = (a: Entry, b: Entry) => (b.total ?? 0) - (a.total ?? 0);
  const peak = entries.filter(e => e.recommend === 'Peak').sort(byScore);
  // Guests get a way in: the must-watch picks, or the best of the Peak shelf.
  const startHere = mustWatchEntries.length >= 4 ? mustWatchEntries : peak.slice(0, 10);
  const shame = entries.filter(e => e.recommend === 'Garbage').sort((a, b) => (a.total ?? 0) - (b.total ?? 0)).slice(0, 15);

  // Hot takes: biggest disagreements with IMDb, either direction.
  const takes = entries
    .filter(e => (e.total ?? 0) > 0 && e.movie.imdb_rating)
    .map(e => ({ e, delta: (e.total ?? 0) - Number(e.movie.imdb_rating) }))
    .filter(t => Math.abs(t.delta) >= 1.5)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 12);
  const takeCaptions = Object.fromEntries(takes.map(({ e, delta }) => [
    e.id, `IMDb ${Number(e.movie.imdb_rating).toFixed(1)} · ${delta > 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}`,
  ]));

  // Top-rated entries with BOTH poster AND backdrop for the hero carousel
  // Films only: a series' score covers a whole season, so it doesn't rank against films.
  const slides = remainingEntries
    .filter(e => e.movie.media_type !== 'tv' && e.movie.backdrop_url && e.movie.poster_url)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 8);

  return (
    <div className="browse-page home-page">
      <HeroBackground />

      <HeroCarousel
        slides={slides}
        canStream={!!user}
        totalFilms={entries.length}
      />

      {!user && (
        <div className="guest-notice-banner">
          <p className="guest-notice-text">
            You&apos;re looking at my horror collection. My friends get accounts to stream and keep their own vaults. Everyone else, feel free to look around and disagree with my ratings.
          </p>
          <Link href="/taste" className="btn-secondary guest-notice-link">
            See {ownerName}&rsquo;s taste
          </Link>
        </div>
      )}

      {/* Friends get their own rows first; the owner's home stays the showcase. */}
      {user && user.id !== process.env.OWNER_USER_ID && (
        <Suspense fallback={null}>
          <MemberCorner userId={user.id} />
        </Suspense>
      )}

      <RecentlyViewedRow reserve={hasRecent} />

      {!user && startHere.length > 0 ? (
        <CategoryRow label="Start here" heading={{ title: 'Start', accent: 'here', subtitle: 'First time here? I’d start with these.' }} entries={startHere} />
      ) : mustWatchEntries.length > 0 && (
        <CategoryRow label="Must watch" entries={mustWatchEntries} />
      )}

      {user?.id !== process.env.OWNER_USER_ID && <DareSection />}

      <Suspense fallback={null}>
        <ComingSoonWidget linkable={!!user} />
      </Suspense>

      {peak.length > 0 && (
        <CategoryRow
          label="Rated Peak"
          heading={{ title: 'Rated', accent: 'peak', subtitle: 'The highest verdict I give out. Not many films get it.' }}
          entries={peak.slice(0, 15)}
        />
      )}

      {takes.length > 0 && (
        <CategoryRow
          label="Hot takes"
          heading={{ title: 'Hot', accent: 'takes', subtitle: 'Where IMDb and I don’t agree, sometimes by a lot.' }}
          entries={takes.map(t => t.e)}
          captions={takeCaptions}
        />
      )}

      {shame.length > 0 && (
        <CategoryRow
          label="Hall of shame"
          heading={{ title: 'Hall of', accent: 'shame', subtitle: 'Rated Garbage. I watched these so you don’t have to.' }}
          entries={shame}
        />
      )}

      <Suspense fallback={<ActivityFeedSkeleton />}>
        <ActivityFeed />
      </Suspense>

      <section className="home-vault-section">
        <div className="home-section-head">
          <PageHeader
            as="section"
            title="From the"
            accent="vault"
            subtitle="Everything I’ve logged, sorted by subgenre."
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
