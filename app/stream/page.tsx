import { redirect }           from 'next/navigation';
import StreamHeroClient        from '@/components/stream/StreamHeroClient';
import CategoryRow             from '@/components/browse/CategoryRow';
import TmdbRow                 from '@/components/browse/TmdbRow';
import type { Entry }          from '@/lib/types';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { getTrendingHorror, getTopRatedHorror, getRecentHorror } from '@/lib/tmdb';

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

export default async function StreamPage() {
  // Auth check — streaming is members only
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login?next=/stream');

  // Fetch data in parallel
  const [entries, trending, topRated, recent] = await Promise.all([
    getOwnerEntries(),
    getTrendingHorror(),
    getTopRatedHorror(),
    getRecentHorror(),
  ]);

  // Top 5 with backdrop for hero carousel
  const featured = entries
    .filter(e => e.movie.backdrop_url ?? e.movie.poster_url)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 5);

  // Only entries that can be streamed (have omdb_id)
  const streamable = entries.filter(e => e.movie.omdb_id);

  // Group by subgenre
  const bySubgenre: Record<string, Entry[]> = {};
  for (const entry of streamable) {
    if (!bySubgenre[entry.subgenre]) bySubgenre[entry.subgenre] = [];
    bySubgenre[entry.subgenre].push(entry);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <StreamHeroClient featured={featured} />

      <div style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* TMDB discovery rows */}
        <TmdbRow label="New &amp; Popular"    movies={trending}  />
        <TmdbRow label="Highly Rated"         movies={topRated}  />
        <TmdbRow label="Recently Released"    movies={recent}    />

        {/* Owner vault by subgenre */}
        {SUBGENRE_ORDER.map(genre => {
          const genreEntries = bySubgenre[genre];
          if (!genreEntries || genreEntries.length < 2) return null;
          return <CategoryRow key={genre} label={genre} entries={genreEntries} />;
        })}

        {streamable.length === 0 && (
          <div style={{
            padding: '80px 40px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
          }}>
            <p>No streamable entries yet.</p>
            <p style={{ marginTop: 8, fontSize: 12 }}>
              Films need an OMDb ID linked to stream.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
