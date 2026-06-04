import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/movies
 * Returns all entries for the authenticated user, joined with movie metadata.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('entries')
    .select(`
      *,
      movie:movies (*)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET /api/movies error', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
