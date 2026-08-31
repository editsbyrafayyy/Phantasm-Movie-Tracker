import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';

/**
 * GET /api/movies
 * Returns all entries for the authenticated user, joined with movie metadata.
 * Private cache: fresh for 15s, SWR up to 60s. Mutations (add/delete entry)
 * should trigger a client-side refetch to handle the stale window.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit(ip, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('entries')
    .select(`
      *,
      movie:movies (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET /api/movies error', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' },
  });
}
