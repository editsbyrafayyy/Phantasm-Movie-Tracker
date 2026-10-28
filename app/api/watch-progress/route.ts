import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import { loadWatchProgress } from '@/lib/watchProgress';

/**
 * Per-user "Continue watching" (table: watch_progress, RLS: own rows only).
 * GET    → the signed-in user's recent titles, newest first
 * POST   → upsert one title's progress (sent by WatchProgressTracker / the row)
 * DELETE → ?id=<media id> removes one title; no id clears the list
 * Responses use the same shape as the old localStorage history entries.
 */

const MEDIA_ID_RE = /^(tt\d{5,10}|\d{1,10})$/;

const intIn = (v: unknown, max: number): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n) : null;
};

async function session() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await session();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await loadWatchProgress(supabase, user.id);
  if (!items) return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  return NextResponse.json(items, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await session();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!rateLimit(getClientIp(req), 60, 60_000, 'POST /api/watch-progress')) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const text = await req.text();
  if (text.length > 2048) return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  let body: Record<string, unknown>;
  try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const id = typeof body.id === 'string' ? body.id : '';
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
  if (!MEDIA_ID_RE.test(id) || !title) return NextResponse.json({ error: 'Invalid entry' }, { status: 400 });

  const poster = typeof body.poster_url === 'string' && /^https:\/\//.test(body.poster_url) && body.poster_url.length <= 500
    ? body.poster_url : null;
  // Older entries may hold progress as a 0-1 ratio.
  const rawProgress = typeof body.progress === 'number' && body.progress > 0 && body.progress < 1 ? body.progress * 100 : body.progress;

  const { error } = await supabase.from('watch_progress').upsert({
    user_id:    user.id,
    media_id:   id,
    media_type: body.type === 'tv' ? 'tv' : 'movie',
    title,
    poster_url: poster,
    progress:   intIn(rawProgress, 100),
    position_s: intIn(body.currentTime, 1_000_000),
    duration_s: intIn(body.duration, 1_000_000),
    season:     intIn(body.season, 999),
    episode:    intIn(body.episode, 9999),
    completed:  body.completed === true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,media_id' });

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await session();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (id !== null && !MEDIA_ID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let query = supabase.from('watch_progress').delete().eq('user_id', user.id);
  if (id) query = query.eq('media_id', id);
  const { error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
