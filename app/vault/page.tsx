import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/server';
import MovieGrid from '@/components/vault/MovieGrid';
import type { Entry } from '@/lib/types';

export const metadata: Metadata = {
  title: 'The Vault — Horror Movie Tracker',
};

export default async function VaultPage() {
  const supabase = createServiceClient();
  const ownerId = process.env.OWNER_USER_ID;

  // Fetch all entries for the vault owner using the service client (guests can browse)
  const { data: entries, error } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('user_id', ownerId)
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
