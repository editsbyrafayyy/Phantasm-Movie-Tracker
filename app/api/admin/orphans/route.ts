import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { selectAll } from '@/lib/selectAll';
import { ownerOnly } from '../_owner';

/**
 * DELETE: remove catalog films that no member has logged and no list contains
 * (list_items cascades on movie delete, so listed films must be kept).
 * Watch Later rows reference TMDB ids, not movies rows, so they are unaffected.
 */
export async function DELETE() {
  const denied = await ownerOnly();
  if (denied) return denied;

  const service = createServiceClient();
  const [moviesRes, entriesRes, listRes] = await Promise.all([
    selectAll<{ id: string }>((a, b) => service.from('movies').select('id').order('id').range(a, b)),
    selectAll<{ movie_id: string }>((a, b) => service.from('entries').select('movie_id').order('id').range(a, b)),
    selectAll<{ movie_id: string }>((a, b) => service.from('list_items').select('movie_id').order('movie_id').range(a, b)),
  ]);
  const readError = moviesRes.error ?? entriesRes.error ?? listRes.error;
  if (readError) {
    console.error('[DELETE /api/admin/orphans]', readError);
    return NextResponse.json({ error: 'Failed to read the catalog' }, { status: 500 });
  }

  const used = new Set([...(entriesRes.data ?? []), ...(listRes.data ?? [])].map(r => r.movie_id));
  const orphanIds = (moviesRes.data ?? []).map(m => m.id).filter(id => !used.has(id));
  if (!orphanIds.length) return NextResponse.json({ success: true, removed: 0 });

  // Chunked so the id filter stays well inside URL length limits.
  for (let i = 0; i < orphanIds.length; i += 100) {
    const { error } = await service.from('movies').delete().in('id', orphanIds.slice(i, i + 100));
    if (error) {
      console.error('[DELETE /api/admin/orphans]', error);
      return NextResponse.json({ error: 'Failed to remove unused films' }, { status: 500 });
    }
  }
  revalidateTag('owner-entries', { expire: 0 });
  return NextResponse.json({ success: true, removed: orphanIds.length });
}
