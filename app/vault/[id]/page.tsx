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
  return { title: `${title} — Phantasm` };
}

export default async function VaultEntryPage({ params }: Props) {
  const { id } = await params;
  const ownerId = process.env.OWNER_USER_ID;

  // Use service client to fetch data — allows guests to view any entry
  const supabase = createServiceClient();

  // Parallelize session check and main entry fetch (support both entry.id and movie_id)
  const authClientPromise = createServerSupabaseClient();
  const entryPromise = supabase
    .from('entries')
    .select('*, movie:movies (*), user_id')
    .eq('id', id)
    .maybeSingle();

  const [authClient, entryRes] = await Promise.all([
    authClientPromise,
    entryPromise
  ]);

  const { data: { user } } = await authClient.auth.getUser();

  let entry = entryRes.data;
  if (!entry) {
    // If accessed by movie_id, first check for the user's own entry
    if (user?.id) {
      const userEntryRes = await supabase
        .from('entries')
        .select('*, movie:movies (*), user_id')
        .eq('movie_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (userEntryRes.data) {
        entry = userEntryRes.data;
      }
    }

    // Fallback to the owner's entry for this movie_id
    if (!entry && ownerId) {
      const ownerEntryRes = await supabase
        .from('entries')
        .select('*, movie:movies (*), user_id')
        .eq('movie_id', id)
        .eq('user_id', ownerId)
        .maybeSingle();
      entry = ownerEntryRes.data;
    }
  }

  if (!entry) notFound();

  const sessionUserId = user?.id ?? null;
  const isSiteOwner = sessionUserId !== null && sessionUserId === ownerId;
  const isEntryOwner = sessionUserId !== null && sessionUserId === entry.user_id;

  const isOwnerEntry = ownerId && entry.user_id === ownerId;
  const isOwnEntry = isEntryOwner;
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
      isOwner={isEntryOwner}
      isSiteOwner={isSiteOwner}
      canStream={!!user}
    />
  );
}
