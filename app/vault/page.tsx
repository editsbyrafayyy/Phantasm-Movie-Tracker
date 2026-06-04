import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import MovieGrid from '@/components/vault/MovieGrid';
import type { Entry } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Your Vault — Horror Movie Tracker',
};

export default async function VaultPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null; // Middleware handles the redirect

  // Fetch all entries for this user
  const { data: entries, error } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const safeEntries: Entry[] = (entries ?? []) as Entry[];

  return (
    <div className="vault-page">
      {/* Header */}
      <header className="vault-header">
        <div className="vault-header-inner">
          <h1 className="vault-heading">
            <span className="vault-heading-light">Your</span>{' '}
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
          <p>Failed to load your vault. Please try refreshing.</p>
        </div>
      ) : (
        <MovieGrid entries={safeEntries} />
      )}
    </div>
  );
}
