import { Suspense } from 'react';
import type { Metadata } from 'next';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { getOwnerEntries } from '@/lib/data';
import MovieGrid from '@/components/vault/MovieGrid';
import { VaultSkeleton } from '@/components/vault/VaultSkeleton';
import type { Entry } from '@/lib/types';

export const metadata: Metadata = {
  title: 'The Vault — Horror Movie Tracker',
};

async function VaultContent() {
  // Check if there is an authenticated user session
  const userSupabase = await createServerSupabaseClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  const ownerId = process.env.OWNER_USER_ID;

  // ── Unauthenticated: serve owner's cached vault (no DB hit) ──
  if (!user) {
    if (!ownerId) {
      return (
        <div className="vault-error" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          <p>Vault configuration is incomplete. Please sign in or configure OWNER_USER_ID.</p>
        </div>
      );
    }
    const entries = await getOwnerEntries();
    return <MovieGrid entries={entries} />;
  }

  // ── Authenticated: fetch user's own vault fresh, narrow columns ──
  const supabase = createServiceClient();
  const { data: entries, error } = await supabase
    .from('entries')
    .select(`
      id, user_id, movie_id, created_at,
      total, atmosphere, story, characters, rewatchability, recommend,
      subgenre, review_notes, custom_tags, must_watch, watchlist,
      movie:movies (
        id, title, year, runtime_min,
        poster_url, backdrop_url,
        omdb_id, tmdb_id,
        director, cast, plot
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="vault-error">
        <p>Failed to load the vault. Please try refreshing.</p>
      </div>
    );
  }

  const safeEntries: Entry[] = ((entries ?? []) as unknown) as Entry[];
  return <MovieGrid entries={safeEntries} />;
}

export default function VaultPage() {
  return (
    <div className="vault-page">
      {/* Header */}
      <header className="vault-header">
        <div className="vault-header-inner">
          <h1 className="vault-heading">
            <span className="vault-heading-light">The</span>{' '}
            <em className="vault-heading-serif">Vault</em>
          </h1>
        </div>
      </header>

      <Suspense fallback={<VaultSkeleton count={12} />}>
        <VaultContent />
      </Suspense>
    </div>
  );
}
