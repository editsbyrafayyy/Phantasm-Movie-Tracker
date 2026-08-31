import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';

interface WatchlistItem {
  tmdb_id:    number;
  media_type: string;
  title:      string;
  poster_url: string | null;
  year:       number | null;
}

// ── GET /api/watchlist — fetch current user's watchlist ───────────────────────
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit(ip, 60, 60_000)) {
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
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit(ip, 30, 60_000)) {
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

  if (!body.tmdb_id || !body.title) {
    return NextResponse.json({ error: 'tmdb_id and title are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('watchlist')
    .upsert(
      {
        user_id:    user.id,
        tmdb_id:    body.tmdb_id,
        media_type: body.media_type ?? 'movie',
        title:      body.title,
        poster_url: body.poster_url ?? null,
        year:       body.year ?? null,
      },
      { onConflict: 'user_id,tmdb_id,media_type' }
    )
    .select('id')
    .single();

  if (error) {
    console.error('POST /api/watchlist error', error);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id });
}

// ── DELETE /api/watchlist — remove a film from watchlist ──────────────────────
export async function DELETE(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit(ip, 30, 60_000)) {
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

