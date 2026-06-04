import Image   from 'next/image';
import Link    from 'next/link';
import { Moon, Play, LogIn } from 'lucide-react';
import HeroBackground from '@/components/HeroBackground';
import CategoryRow    from '@/components/browse/CategoryRow';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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

async function getOwnerEntries(): Promise<Entry[]> {
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const res = await fetch(`${base}/api/owner-vault`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Vault — Horror Film Tracker",
  description: "A curated collection of horror films, scored across 8 criteria.",
};

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  const entries = await getOwnerEntries();

  // Top-rated entry with a backdrop for the hero
  const featured = entries
    .filter(e => e.movie.backdrop_url ?? e.movie.poster_url)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))[0] ?? null;

  // Group by subgenre for the category rows
  const bySubgenre: Record<string, Entry[]> = {};
  for (const entry of entries) {
    if (!bySubgenre[entry.subgenre]) bySubgenre[entry.subgenre] = [];
    bySubgenre[entry.subgenre].push(entry);
  }

  const heroBg = featured?.movie.backdrop_url ?? featured?.movie.poster_url ?? null;
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

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="browse-hero" style={{ minHeight: '65vh', marginTop: 0 }}>
        {heroBg && (
          <Image
            src={heroBg}
            alt={featured?.movie.title ?? 'Featured film'}
            fill
            style={{ objectFit:'cover', objectPosition:'center top', zIndex:0 }}
            unoptimized
            priority
          />
        )}
        {/* Gradient overlay */}
        <div style={{
          position:'absolute', inset:0, zIndex:1,
          background: heroBg
            ? 'linear-gradient(to right, rgba(8,8,8,0.96) 28%, rgba(8,8,8,0.55) 62%, transparent 100%), linear-gradient(to top, rgba(8,8,8,0.92) 0%, transparent 52%)'
            : 'linear-gradient(135deg, #080808 0%, #1a0808 100%)',
        }} />

        <div className="browse-hero-content" style={{ zIndex:2, paddingTop:90 }}>
          <p style={{
            fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700,
            letterSpacing:'2.5px', textTransform:'uppercase',
            color:'var(--text-muted)', marginBottom:10,
          }}>
            {ownerName}&apos;s Vault · {entries.length} Films Rated
          </p>

          {featured ? (
            <>
              <h1 style={{
                fontFamily:'var(--font-sans)', fontWeight:700, lineHeight:1.1,
                fontSize:'clamp(28px,5vw,54px)', color:'#ffffff', marginBottom:10,
              }}>
                {featured.movie.title}
              </h1>

              {featured.total !== null && featured.total > 0 && (
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:16 }}>
                  <span style={{
                    fontFamily:'var(--font-display)',
                    fontSize:'clamp(44px,7vw,68px)',
                    color:'var(--red)', lineHeight:1,
                  }}>
                    {featured.total}
                  </span>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:16, color:'var(--text-muted)' }}>
                    / 10
                  </span>
                </div>
              )}

              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {featured.movie.omdb_id && (
                  <Link href={`/stream/${featured.movie.omdb_id}`} className="btn-watch">
                    <Play size={14} fill="white" color="white" />
                    Watch Now
                  </Link>
                )}
                <Link href={`/vault/${featured.id}`} className="btn-edit">
                  View Details
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 style={{
                fontFamily:'var(--font-sans)', fontWeight:700, lineHeight:1.1,
                fontSize:'clamp(32px,5vw,60px)', color:'#ffffff', marginBottom:14,
              }}>
                Horror. Rated.
              </h1>
              <p style={{ fontSize:15, color:'var(--text-dim)', marginBottom:20, maxWidth:440 }}>
                A curated collection of horror films scored across atmosphere, story, dread, and more.
              </p>
              <Link href="/login" className="btn-watch">
                <LogIn size={14} />
                Sign In to Rate
              </Link>
            </>
          )}
        </div>
      </div>

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
