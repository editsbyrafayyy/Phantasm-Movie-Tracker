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

  const { data: { user } } = await authClient.auth.getUser();

  if (error || !entry) notFound();

  const sessionUserId = user?.id ?? null;
  const isOwner = sessionUserId !== null && sessionUserId === ownerId;

  const isOwnerEntry = ownerId && entry.user_id === ownerId;
  const isOwnEntry = sessionUserId !== null && entry.user_id === sessionUserId;
  if (!isOwnerEntry && !isOwnEntry) notFound();

  const similarScopeUserId = isOwnerEntry ? ownerId : sessionUserId;

  // Fetch all entries for franchise tracking & similar entries
  const [similarRes, allEntriesRes] = await Promise.all([
    supabase
      .from('entries')
      .select('*, movie:movies (*)')
      .eq('subgenre', entry.subgenre)
      .eq('user_id', similarScopeUserId)
      .neq('id', id)
      .order('total', { ascending: false })
      .limit(10),
    supabase
      .from('entries')
      .select('*, movie:movies (*)')
      .eq('user_id', similarScopeUserId)
  ]);

  const similar = similarRes.data ?? [];
  const allEntries = allEntriesRes.data ?? [];

  return (
    <MovieDetailV3
      entry={entry as Entry}
      similar={similar as Entry[]}
      allEntries={allEntries as Entry[]}
      isOwner={isOwner}
      canStream={!!user}
    />
  );
}
