import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import MovieDetailV3 from '@/components/vault/MovieDetailV3';
import type { Entry } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
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
  const supabase = await createServerSupabaseClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) notFound();

  // Fetch the specific entry with its joined movie
  const { data: entry, error } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !entry) notFound();

  // Fetch similar entries: same subgenre, excluding the current entry, ordered by score
  const { data: similar } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('user_id', session.user.id)
    .eq('subgenre', entry.subgenre)
    .neq('id', id)
    .order('total', { ascending: false })
    .limit(10);

  return (
    <MovieDetailV3
      entry={entry as Entry}
      similar={(similar ?? []) as Entry[]}
    />
  );
}
