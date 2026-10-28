import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getOwnerEntries } from '@/lib/data';
import MovieGrid from '@/components/vault/MovieGrid';
import { VaultSkeleton } from '@/components/vault/VaultSkeleton';
import PageHeader from '@/components/ui/PageHeader';
import { gridPosterUrl } from '@/components/vault/posterSrc';
import type { VaultGridEntry } from '@/lib/types';

export const metadata: Metadata = {
  title: 'The Vault — Phantasm',
};

/** Columns the grid, cards and filters actually read. */
const GRID_SELECT =
  'id, subgenre, secondary_tag, recommend, total, created_at, ' +
  'movie:movies (title, year, runtime_min, poster_url, backdrop_url, director, tmdb_id, cast_list)';

type CastItem = string | { name?: string | null } | null;
interface GridRow {
  id: string;
  subgenre: string;
  secondary_tag: string | null;
  recommend: VaultGridEntry['recommend'];
  total: number | null;
  created_at: string;
  movie: (Omit<VaultGridEntry['movie'], 'cast_names'> & { cast_list?: CastItem[] | null }) | null;
}

/** cast_list items are stored either as objects or as JSON-encoded strings. */
function castName(c: CastItem): string {
  if (!c) return '';
  if (typeof c !== 'string') return c.name ?? '';
  if (!c.startsWith('{')) return c;
  try {
    const parsed = JSON.parse(c) as { name?: unknown };
    return typeof parsed.name === 'string' ? parsed.name : '';
  } catch {
    return '';
  }
}

/** Project a full or partial row down to what the client needs (keeps the RSC payload small). */
function toGridEntry(row: GridRow): VaultGridEntry {
  const m = row.movie;
  const poster = gridPosterUrl(m?.poster_url ?? null);
  return {
    id: row.id,
    subgenre: row.subgenre,
    secondary_tag: row.secondary_tag ?? null,
    recommend: row.recommend ?? null,
    total: row.total,
    created_at: row.created_at,
    movie: {
      title: m?.title ?? 'Unknown',
      year: m?.year ?? null,
      runtime_min: m?.runtime_min ?? null,
      poster_url: poster,
      // The backdrop is only a fallback image for posterless films — don't ship it otherwise.
      backdrop_url: poster ? null : (m?.backdrop_url ?? null),
      director: m?.director ?? null,
      tmdb_id: m?.tmdb_id ?? null,
      cast_names: (m?.cast_list ?? []).map(castName).filter(Boolean).slice(0, 12),
    },
  };
}

async function VaultContent() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let entries: VaultGridEntry[];

  if (!user) {
    // Guests see the owner's showcase (cached, no per-request DB hit).
    if (!process.env.OWNER_USER_ID) {
      return (
        <div className="vault-content">
          <div className="empty-state" role="alert">
            <p className="empty-state-title">Vault unavailable</p>
            <p className="empty-state-body">Sign in to see your vault.</p>
          </div>
        </div>
      );
    }
    const owner = await getOwnerEntries();
    entries = (owner as unknown as GridRow[]).map(toGridEntry);
  } else {
    // Signed in: the user's own entries through the user-scoped client, so RLS applies.
    const { data, error } = await supabase
      .from('entries')
      .select(GRID_SELECT)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return (
        <div className="vault-content">
          <div className="empty-state" role="alert">
            <p className="empty-state-title">Could not load the vault</p>
            <p className="empty-state-body">Refresh the page to try again.</p>
          </div>
        </div>
      );
    }
    entries = ((data ?? []) as unknown as GridRow[]).map(toGridEntry);
  }

  if (user && entries.length === 0) return <VaultOnboarding />;

  return (
    <>
      <div className="vault-content vault-head">
        <PageHeader
          title="The Vault"
          eyebrow={`${entries.length} film${entries.length === 1 ? '' : 's'} rated`}
        />
      </div>
      <MovieGrid entries={entries} />
    </>
  );
}

const ONBOARD_STEPS = [
  { href: '/add',       title: 'Log a film',     body: 'Search for anything you’ve watched and score it. Same eight categories I use.' },
  { href: '/stream',    title: 'Find something', body: 'Pick a genre or a mood, watch it right here, then rate it straight from the player.' },
  { href: '/watchlist', title: 'Save for later', body: 'Put things in Watch Later so you don’t forget about them.' },
];

/** A member's first visit: what the vault is for and where to start. */
function VaultOnboarding() {
  return (
    <>
      <div className="vault-content vault-head">
        <PageHeader title="Your" accent="vault" eyebrow="Nothing rated yet" subtitle="Anything you rate ends up here. Your stats show up on your profile once there’s enough to work with." />
      </div>
      <div className="vault-content">
        <ol className="vault-onboard">
          {ONBOARD_STEPS.map((step, i) => (
            <li key={step.href}>
              <Link href={step.href} className="vault-onboard-step">
                <span className="vault-onboard-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="vault-onboard-title">{step.title}</span>
                <span className="vault-onboard-body">{step.body}</span>
                <ArrowRight size={18} className="vault-onboard-arrow" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

export default function VaultPage() {
  return (
    <div className="vault-page">
      <Suspense fallback={<VaultSkeleton count={15} />}>
        <VaultContent />
      </Suspense>
    </div>
  );
}
