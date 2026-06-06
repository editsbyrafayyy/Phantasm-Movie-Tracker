import Link    from 'next/link';
import HeroBackground from '@/components/HeroBackground';
import HeroCarousel   from '@/components/browse/HeroCarousel';
import CategoryRow from '@/components/browse/CategoryRow';
import VaultFilter    from '@/components/home/VaultFilter';
import StreamRail     from '@/components/layout/StreamRail';
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

import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

async function getOwnerEntries(): Promise<Entry[]> {
  const OWNER_ID = process.env.OWNER_USER_ID;
  if (!OWNER_ID) return [];

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('user_id', OWNER_ID)
    .order('created_at', { ascending: false });

  return data ?? [];
}

export const revalidate = 300;

export const metadata = {
  title: "Vault — Horror Film Tracker",
  description: "A curated collection of horror films, scored across 8 criteria.",
};

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  const entries = await getOwnerEntries();

  // Top-rated entries with backdrop for the hero carousel
  const slides = entries
    .filter(e => e.movie.backdrop_url ?? e.movie.poster_url)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 8);

  const ownerName = process.env.NEXT_PUBLIC_OWNER_USERNAME ?? 'Rafayyy';

  // Filter owner's recommendations
  const recommendedEntries = entries.filter(e => e.owner_recommended === true);

  return (
    <div className="browse-page">
      <HeroBackground />

      <StreamRail />

      {/* ── Hero Carousel ───────────────────────────── */}
      <HeroCarousel
        slides={slides}
        canStream={!!session}
        ownerName={ownerName}
        totalFilms={entries.length}
      />

      {/* ── Rafay's Recommendations ────────────────────── */}
      {recommendedEntries.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <CategoryRow label="Rafay's Recommendations" entries={recommendedEntries} />
        </div>
      )}

      {/* ── My Vault ──────────────────────────────────── */}
      <div className="home-vault-section">
        <h2 className="home-vault-heading">From the Vault</h2>
        <p className="home-vault-sub">Curated films scored and stored by {ownerName}.</p>
      </div>

      <VaultFilter entries={entries} subgenreOrder={SUBGENRE_ORDER} />
    </div>
  );
}
