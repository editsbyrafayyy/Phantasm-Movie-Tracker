import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { getMovieFranchise } from '@/lib/config';
import MovieDetailV3 from '@/components/vault/MovieDetailV3';
import type { Entry, RelatedEntry } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };

const ENTRY_SELECT = '*, movie:movies (*)';
const RELATED_SELECT = 'id, total, subgenre, movie:movies (id, title, year, poster_url, backdrop_url)';

type RelatedRow = RelatedEntry & { subgenre: string };

/**
 * Entry lookup by entry id, shared by generateMetadata and the page (deduped per request).
 * Service client so guests can view the owner's showcase; access is checked in the page.
 */
const getEntryById = cache(async (id: string): Promise<Entry | null> => {
  const { data } = await createServiceClient()
    .from('entries')
    .select(ENTRY_SELECT)
    .eq('id', id)
    .maybeSingle();
  return (data as Entry | null) ?? null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const entry = await getEntryById(id);
  return { title: `${entry?.movie?.title ?? 'Film detail'} — Phantasm` };
}

export default async function VaultEntryPage({ params }: Props) {
  const { id } = await params;
  const ownerId = process.env.OWNER_USER_ID;
  const supabase = createServiceClient();

  const [{ data: { user } }, byEntryId] = await Promise.all([
    createServerSupabaseClient().then(c => c.auth.getUser()),
    getEntryById(id),
  ]);

  let entry = byEntryId;
  if (!entry) {
    // Accessed by movie_id: prefer the signed-in user's own entry, then the owner's showcase entry.
    if (user?.id) {
      const { data } = await supabase
        .from('entries')
        .select(ENTRY_SELECT)
        .eq('movie_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      entry = (data as Entry | null) ?? null;
    }
    if (!entry && ownerId) {
      const { data } = await supabase
        .from('entries')
        .select(ENTRY_SELECT)
        .eq('movie_id', id)
        .eq('user_id', ownerId)
        .maybeSingle();
      entry = (data as Entry | null) ?? null;
    }
  }

  if (!entry) notFound();

  const sessionUserId = user?.id ?? null;
  const isSiteOwner = sessionUserId !== null && sessionUserId === ownerId;
  const isEntryOwner = sessionUserId !== null && sessionUserId === entry.user_id;
  const isOwnerEntry = !!ownerId && entry.user_id === ownerId;
  if (!isOwnerEntry && !isEntryOwner) notFound();

  // One slim query for the vault this entry belongs to; similar + franchise are derived here
  // so only ~a dozen small rows are sent to the client.
  const { data: relatedData } = await supabase
    .from('entries')
    .select(RELATED_SELECT)
    .eq('user_id', entry.user_id);
  const related = ((relatedData ?? []) as unknown as RelatedRow[]).filter(r => r.movie);

  const current = entry;
  const currentTotal = current.total ?? 0;
  const similar: RelatedEntry[] = related
    .filter(r => r.id !== current.id && r.subgenre === current.subgenre)
    .sort((a, b) => Math.abs((a.total ?? 0) - currentTotal) - Math.abs((b.total ?? 0) - currentTotal))
    .slice(0, 10)
    .map(({ id: rid, total, movie }) => ({ id: rid, total, movie }));

  const franchiseName = getMovieFranchise(current.movie?.title ?? '');
  const franchiseEntries: RelatedEntry[] = franchiseName
    ? related
        .filter(r => getMovieFranchise(r.movie.title ?? '') === franchiseName)
        .map(({ id: rid, total, movie }) => ({ id: rid, total, movie }))
    : [];

  return (
    <MovieDetailV3
      entry={entry}
      similar={similar}
      franchiseEntries={franchiseEntries}
      isOwner={isEntryOwner}
      isSiteOwner={isSiteOwner}
      canStream={!!user}
    />
  );
}
