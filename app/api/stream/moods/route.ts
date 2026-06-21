import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';

export const revalidate = 60; // ISR cache at CDN level for 1 minute

export async function GET(req: NextRequest) {
  // Apply general rate limit (60 requests per minute)
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const moodId = searchParams.get('mood');

    const serviceClient = createServiceClient();

    if (moodId) {
      const { data, error } = await serviceClient
        .from('mood_cache')
        .select('*')
        .eq('mood', moodId)
        .maybeSingle();

      if (error) {
        console.error(`[GET /api/stream/moods] DB error for mood ${moodId}:`, error.message);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      return NextResponse.json({ results: data?.payload ?? [] }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        }
      });
    } else {
      // Fetch all moods
      const { data, error } = await serviceClient
        .from('mood_cache')
        .select('*');

      if (error) {
        console.error('[GET /api/stream/moods] DB error fetching all:', error.message);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      // Convert array to a key-value dictionary mapping mood -> payload
      const allMoods: Record<string, any[]> = {};
      if (data) {
        for (const row of data) {
          allMoods[row.mood] = row.payload;
        }
      }

      return NextResponse.json(allMoods, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        }
      });
    }
  } catch (err: any) {
    console.error('[GET /api/stream/moods] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
