import { Suspense } from 'react';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getOwnerEntries } from '@/lib/data';
import MovieGrid from '@/components/vault/MovieGrid';
import { VaultSkeleton } from '@/components/vault/VaultSkeleton';
import PageHeader from '@/components/ui/PageHeader';
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

/** Project a full or partial row down to what the client needs (keeps the RSC payload small). */
function toGridEntry(row: GridRow): VaultGridEntry {
  const m = row.movie;
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
      poster_url: m?.poster_url ?? null,
      backdrop_url: m?.backdrop_url ?? null,
      director: m?.director ?? null,
      tmdb_id: m?.tmdb_id ?? null,
      cast_names: (m?.cast_list ?? [])
        .map(c => (typeof c === 'string' ? c : c?.name ?? ''))
        .filter(Boolean)
        .slice(0, 12),
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

export default function VaultPage() {
  return (
    <div className="vault-page">
      <Suspense fallback={<VaultSkeleton count={15} />}>
        <VaultContent />
      </Suspense>
    </div>
  );
}
