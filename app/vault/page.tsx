import type { Metadata } from 'next';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';
import MovieGrid from '@/components/vault/MovieGrid';
import type { Entry } from '@/lib/types';

export const metadata: Metadata = {
  title: 'The Vault — Horror Movie Tracker',
};

export default async function VaultPage() {
  // Check if there is an authenticated user session
  const userSupabase = await createServerSupabaseClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  const ownerId = process.env.OWNER_USER_ID;
  const targetUserId = user ? user.id : ownerId;

  if (!targetUserId) {
    return (
      <div className="vault-page">
        <header className="vault-header">
          <div className="vault-header-inner">
            <h1 className="vault-heading">
              <span className="vault-heading-light">The</span>{' '}
              <em className="vault-heading-serif">Vault</em>
            </h1>
          </div>
        </header>
        <div className="vault-error" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          <p>Vault configuration is incomplete. Please sign in or configure OWNER_USER_ID.</p>
        </div>
      </div>
    );
  }

  const supabase = createServiceClient();

  // Fetch all entries for the target user (either authenticated user or owner fallback)
  const { data: entries, error } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });

  const safeEntries: Entry[] = (entries ?? []) as Entry[];

  return (
    <div className="vault-page">
      {/* Header */}
      <header className="vault-header">
        <div className="vault-header-inner">
          <h1 className="vault-heading">
            <span className="vault-heading-light">The</span>{' '}
            <em className="vault-heading-serif">Vault</em>
          </h1>
          {safeEntries.length > 0 && (
            <span className="vault-count-badge" aria-label={`${safeEntries.length} films`}>
              {safeEntries.length} {safeEntries.length === 1 ? 'film' : 'films'}
            </span>
          )}
        </div>
      </header>

      {error ? (
        <div className="vault-error">
          <p>Failed to load the vault. Please try refreshing.</p>
        </div>
      ) : (
        <MovieGrid entries={safeEntries} />
      )}
    </div>
  );
}
