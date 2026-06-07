import { NextResponse } from 'next/server';
import { getOwnerEntries } from '@/lib/data';

export const revalidate = 300; // Cache 5 min

/**
 * GET /api/owner-vault
 * Returns the owner's entries publicly (no auth required).
 * Uses the service-role key to bypass RLS and reads entries for OWNER_USER_ID.
 * Cached at the CDN layer for 5 minutes (s-maxage=300).
 */
export async function GET() {
  try {
    const data = await getOwnerEntries();
    return NextResponse.json(data ?? [], {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('GET /api/owner-vault error', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
