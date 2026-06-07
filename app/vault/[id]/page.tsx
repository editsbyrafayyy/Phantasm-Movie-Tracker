import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import MovieDetailV3 from '@/components/vault/MovieDetailV3';
import type { Entry } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('entries')
    .select('movie:movies (title)')
    .eq('id', id)
    .single();

  const title = (data as { movie: { title: string } } | null)?.movie?.title ?? 'Film Detail';
  return { title: `${title} — Vault` };
}

export default async function VaultEntryPage({ params }: Props) {
  const { id } = await params;
  const ownerId = process.env.OWNER_USER_ID;

  // Use service client to fetch data — allows guests to view any entry
  const supabase = createServiceClient();

  // Parallelize session check and main entry fetch
  const authClientPromise = createServerSupabaseClient();
  const entryPromise = supabase
    .from('entries')
    .select('*, movie:movies (*), user_id')
    .eq('id', id)
    .maybeSingle();

  const [authClient, { data: entry, error }] = await Promise.all([
    authClientPromise,
    entryPromise
  ]);

  const { data: { session } } = await authClient.auth.getSession();

  if (error || !entry) notFound();

  const sessionUserId = session?.user?.id ?? null;
  const isOwner = sessionUserId !== null && sessionUserId === ownerId;

  const isOwnerEntry = ownerId && entry.user_id === ownerId;
  const isOwnEntry = sessionUserId !== null && entry.user_id === sessionUserId;
  if (!isOwnerEntry && !isOwnEntry) notFound();

  const similarScopeUserId = isOwnerEntry ? ownerId : sessionUserId;

  // Fetch similar entries: same subgenre, excluding the current entry, ordered by score
  const { data: similar } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('subgenre', entry.subgenre)
    .eq('user_id', similarScopeUserId)
    .neq('id', id)
    .order('total', { ascending: false })
    .limit(10);

  return (
    <MovieDetailV3
      entry={entry as Entry}
      similar={(similar ?? []) as Entry[]}
      isOwner={isOwner}
      canStream={!!session}
    />
  );
}
