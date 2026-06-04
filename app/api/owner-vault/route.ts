import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const OWNER_ID = process.env.OWNER_USER_ID!;

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const revalidate = 300; // Cache 5 min

/**
 * GET /api/owner-vault
 * Returns the owner's entries publicly (no auth required).
 * Uses the service-role key to bypass RLS and reads entries for OWNER_USER_ID.
 * Cached at the CDN layer for 5 minutes (s-maxage=300).
 */
export async function GET() {
  if (!OWNER_ID) {
    return NextResponse.json({ error: 'Owner not configured' }, { status: 500 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('user_id', OWNER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET /api/owner-vault error', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
