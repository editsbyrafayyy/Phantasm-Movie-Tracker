import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { refreshMoodCache } from '@/lib/moodEngine';

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Owner check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = profile?.role === 'owner' || user.id === process.env.OWNER_USER_ID;

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden. Owner action only.' }, { status: 403 });
    }

    // 3. Server-side Rate Limit: Max 1 refresh per hour across all triggers
    const serviceClient = createServiceClient();
    const { data: latestCache, error: cacheQueryError } = await serviceClient
      .from('mood_cache')
      .select('computed_at')
      .order('computed_at', { ascending: false })
      .limit(1);

    if (cacheQueryError) {
      // If table doesn't exist yet, we let it bypass this check and fail gracefully in refreshMoodCache
      console.warn('[POST /api/stream/moods/refresh] Warning querying cache tables:', cacheQueryError.message);
    } else if (latestCache && latestCache.length > 0 && latestCache[0].computed_at) {
      const lastComputed = new Date(latestCache[0].computed_at).getTime();
      const diffMs = Date.now() - lastComputed;
      const oneHourMs = 3600_000;
      
      if (diffMs < oneHourMs) {
        const minutesLeft = Math.ceil((oneHourMs - diffMs) / 60_000);
        return NextResponse.json({
          error: `Rate limit: Please wait ${minutesLeft} minutes before refreshing again.`
        }, { status: 429 });
      }
    }

    // 4. Trigger cache refresh pipeline
    const result = await refreshMoodCache();

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[POST /api/stream/moods/refresh] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
