import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp } from '@/lib/ratelimit';

interface WatchlistItem {
  tmdb_id:    number;
  media_type: string;
  title:      string;
  poster_url: string | null;
  year:       number | null;
}

// ── GET /api/watchlist — fetch current user's watchlist ───────────────────────
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 60, 60_000, 'GET /api/watchlist')) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('GET /api/watchlist error', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// ── POST /api/watchlist — add a film to watchlist ─────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 30, 60_000, 'POST /api/watchlist')) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: WatchlistItem;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const tmdbId = Number(body?.tmdb_id);
  if (
    !body ||
    !Number.isInteger(tmdbId) || tmdbId <= 0 ||
    typeof body.title !== 'string' || !body.title.trim()
  ) {
    return NextResponse.json({ error: 'tmdb_id and title are required' }, { status: 400 });
  }

  const mediaType = body.media_type === 'tv' ? 'tv' : 'movie';

  // Plain insert (RLS has no UPDATE policy on watchlist, so upsert-on-conflict
  // fails for rows that already exist). A unique violation means it's already saved.
  const { data, error } = await supabase
    .from('watchlist')
    .insert({
      user_id:    user.id,
      tmdb_id:    tmdbId,
      media_type: mediaType,
      title:      body.title.slice(0, 300),
      poster_url: typeof body.poster_url === 'string' ? body.poster_url : null,
      year:       Number.isInteger(body.year) ? body.year : null,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
        .limit(1);
      return NextResponse.json({ success: true, id: existing?.[0]?.id });
    }
    console.error('POST /api/watchlist error', error);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id });
}

// ── DELETE /api/watchlist — remove a film from watchlist ──────────────────────
export async function DELETE(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 30, 60_000, 'DELETE /api/watchlist')) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tmdbId    = searchParams.get('tmdb_id');
  const mediaType = searchParams.get('media_type') ?? 'movie';

  if (!tmdbId) return NextResponse.json({ error: 'tmdb_id is required' }, { status: 400 });

  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id',    user.id)
    .eq('tmdb_id',    Number(tmdbId))
    .eq('media_type', mediaType);

  if (error) {
    console.error('DELETE /api/watchlist error', error);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

