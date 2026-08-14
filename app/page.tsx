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
  title: "Vault — Horror Film Tracker",
  description: "A curated collection of horror films, scored across 8 criteria.",
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
    <div className="browse-page">
      <HeroBackground />

      {/* ── Film Roulette floating trigger ──────────────── */}
      <RouletteTrigger entries={entries} canStream={!!user} />

      {/* ── Hero Carousel ───────────────────────────── */}
      <HeroCarousel
        slides={slides}
        canStream={!!user}
        ownerName={ownerName}
        totalFilms={entries.length}
      />

      {/* ── Guest Notice ───────────────────────────── */}
      {!user && (
        <div className="guest-notice-banner" style={{ marginTop: 24, marginBottom: 24 }}>
          <p className="guest-notice-text">
            You are browsing as a guest. This is {ownerName}&apos;s personal horror vault.
          </p>
          <Link href="/login" className="guest-notice-link" prefetch={true}>
            Sign in →
          </Link>
        </div>
      )}

      {/* ── On This Day Nostalgia Banner ───────────────── */}
      <div style={{ marginTop: 24 }}>
        <OnThisDayWidget />
      </div>

      {/* ── Recently Viewed Row ───────────────────────── */}
      <RecentlyViewedRow />

      {/* ── Must Watch ────────────────────────────────── */}
      {mustWatchEntries.length > 0 && (
        <section className="home-must-watch-row" style={{ marginTop: 80, marginBottom: 40 }}>
          <div className="home-vault-section" style={{ marginTop: 0 }}>
            <h2 className="section-label" style={{ marginBottom: 24 }}>Must Watch</h2>
          </div>
          <CategoryRow label="" entries={mustWatchEntries} />
        </section>
      )}

      {/* ── Coming Soon in Horror ──────────────────────────────── */}
      <Suspense fallback={null}>
        <ComingSoonWidget />
      </Suspense>

      {/* ── Member Activity Feed ───────────────────────────────── */}
      <Suspense fallback={null}>
        <ActivityFeed />
      </Suspense>

      {/* ── My Vault ──────────────────────────────────────────── */}
      <div className="home-vault-section">
        <h2 className="home-vault-heading">From the Vault</h2>
        <p className="home-vault-sub">Curated films scored and stored by {ownerName}.</p>
      </div>

      <VaultFilter entries={remainingEntries} subgenreOrder={SUBGENRE_ORDER} />
    </div>
  );
}
