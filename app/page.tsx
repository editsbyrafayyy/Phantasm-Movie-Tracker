import Link    from 'next/link';
import { Moon, LogIn } from 'lucide-react';
import HeroBackground from '@/components/HeroBackground';
import CategoryRow    from '@/components/browse/CategoryRow';
import HeroCarousel   from '@/components/browse/HeroCarousel';
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

  // Group by subgenre for the category rows
  const bySubgenre: Record<string, Entry[]> = {};
  for (const entry of entries) {
    if (!bySubgenre[entry.subgenre]) bySubgenre[entry.subgenre] = [];
    bySubgenre[entry.subgenre].push(entry);
  }

  const ownerName = process.env.NEXT_PUBLIC_OWNER_USERNAME ?? 'Rafayyy';

  return (
    <div className="browse-page">
      <HeroBackground />

      {/* ── Top Bar ──────────────────────────────────── */}
      <header style={{
        position:       'fixed',
        top: 0, left: 0, right: 0,
        zIndex:         100,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 32px',
        height:         56,
        background:     'rgba(8,8,8,0.88)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderBottom:   '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:7, textDecoration:'none' }}>
            <Moon size={16} color="rgba(255,255,255,0.7)" />
            <span style={{ fontFamily:'var(--font-display)', fontSize:16, letterSpacing:3, color:'#f2f2f2' }}>
              VAULT
            </span>
          </Link>
          {!session && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '2px 6px', borderRadius: 4, marginLeft: 4
            }}>
              Guest View
            </span>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/stream" style={{
            fontSize:13, color:'rgba(255,255,255,0.55)',
            textDecoration:'none', fontFamily:'var(--font-sans)', fontWeight:500,
          }}>
            Stream
          </Link>
          
          {session ? (
            <Link href="/vault" style={{
              display:'flex', alignItems:'center', gap:6,
              fontSize:13, color:'#f2f2f2',
              textDecoration:'none', fontFamily:'var(--font-sans)', fontWeight:600,
              padding:'7px 16px', borderRadius:999,
              border:'1px solid rgba(255,255,255,0.16)',
            }}>
              Your Vault →
            </Link>
          ) : (
            <Link href="/login" style={{
              display:'flex', alignItems:'center', gap:6,
              fontSize:13, color:'#f2f2f2',
              textDecoration:'none', fontFamily:'var(--font-sans)', fontWeight:600,
              padding:'7px 16px', borderRadius:999,
              border:'1px solid rgba(255,255,255,0.16)',
            }}>
              <LogIn size={13} />
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ── Hero Carousel ───────────────────────────── */}
      <HeroCarousel
        slides={slides}
        canStream={!!session}
        ownerName={ownerName}
        totalFilms={entries.length}
      />

      {/* ── Category Rows ─────────────────────────────── */}
      <div className="browse-sections">
        {SUBGENRE_ORDER.map(genre => {
          const genreEntries = bySubgenre[genre];
          if (!genreEntries || genreEntries.length < 2) return null;
          return <CategoryRow key={genre} label={genre} entries={genreEntries} />;
        })}

        {entries.length === 0 && (
          <div style={{
            padding:'80px 48px', textAlign:'center',
            color:'var(--text-muted)', fontFamily:'var(--font-sans)', fontSize:14,
          }}>
            No films in the vault yet.
          </div>
        )}
      </div>
    </div>
  );
}
