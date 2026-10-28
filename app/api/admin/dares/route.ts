import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ownerOnly } from '../_owner';

/** PATCH { tmdbId, status: 'accepted' | 'dismissed' } — owner resolves a dare. */
export async function PATCH(req: NextRequest) {
  const denied = await ownerOnly();
  if (denied) return denied;

  let body: { tmdbId?: unknown; status?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const tmdbId = Number(body.tmdbId);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) return NextResponse.json({ error: 'Invalid film' }, { status: 400 });
  if (body.status !== 'accepted' && body.status !== 'dismissed') return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const { error } = await createServiceClient().from('dares').update({ status: body.status }).eq('tmdb_id', tmdbId);
  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
