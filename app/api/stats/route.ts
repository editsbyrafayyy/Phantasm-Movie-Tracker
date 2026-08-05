import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';
import { computeStats } from '@/lib/stats';
import type { Entry } from '@/lib/types';

// Stats are user-specific and can tolerate 30s staleness.
const STATS_CACHE = 'private, max-age=30, stale-while-revalidate=300';

/**
 * GET /api/stats
 * Returns aggregated statistics for the authenticated user.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: entries, error } = await supabase
    .from('entries')
    .select('*, movie:movies (id, title, poster_url, runtime_min, year)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('GET /api/stats error', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  const stats = computeStats((entries ?? []) as Entry[]);
  return NextResponse.json(stats, { headers: { 'Cache-Control': STATS_CACHE } });
}
