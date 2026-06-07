import { Suspense } from 'react';
import type { Metadata } from 'next';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';
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
  const targetUserId = user ? user.id : ownerId;

  if (!targetUserId) {
    return (
      <div className="vault-error" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
        <p>Vault configuration is incomplete. Please sign in or configure OWNER_USER_ID.</p>
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

  if (error) {
    return (
      <div className="vault-error">
        <p>Failed to load the vault. Please try refreshing.</p>
      </div>
    );
  }

  const safeEntries: Entry[] = (entries ?? []) as Entry[];

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
