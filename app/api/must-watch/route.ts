import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/must-watch
 * Returns owner's must-watch films. Uses service key (no user session).
 * Public CDN cache: 2 min fresh, SWR up to 10 min.
 */
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('entries')
    .select('*, movie:movies(*)')
    .eq('must_watch', true)
    .order('total', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' }
  });
}
