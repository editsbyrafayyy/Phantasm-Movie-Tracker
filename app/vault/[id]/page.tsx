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

  // Use service client to fetch data — allows guests to view any entry
  const supabase = createServiceClient();

  // Use auth client only to determine session (for isOwner check)
  const authClient = await createServerSupabaseClient();
  const { data: { session } } = await authClient.auth.getSession();

  const isOwner = session?.user?.id === process.env.OWNER_USER_ID;

  // Fetch the specific entry with its joined movie (no user_id filter — guests can view)
  const { data: entry, error } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('id', id)
    .maybeSingle();

  if (error || !entry) notFound();

  // Fetch similar entries: same subgenre, excluding the current entry, ordered by score
  const { data: similar } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('subgenre', entry.subgenre)
    .neq('id', id)
    .order('total', { ascending: false })
    .limit(10);

  return (
    <MovieDetailV3
      entry={entry as Entry}
      similar={(similar ?? []) as Entry[]}
      isOwner={isOwner}
    />
  );
}
