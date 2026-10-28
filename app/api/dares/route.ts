import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import { DARE_LIMITS, checkDareToken, hashIp, ownerRatedTmdbIds, screenFilm } from '@/lib/dares';

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * POST { tmdbId, token, website } — dare the owner to watch a film.
 * Layers, cheapest first: same-origin check → per-instance burst limit → size cap →
 * honeypot → signed time-trap token → per-visitor and site-wide limits stored in the
 * database → status/duplicate checks → full TMDB screening → one dare per visitor per film.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  try {
    if (!origin || !host || new URL(origin).host !== host) return fail('Forbidden', 403);
  } catch {
    return fail('Forbidden', 403);
  }

  const ip = getClientIp(req);
  if (!rateLimit(ip, 5, 60_000, 'POST /api/dares')) return fail('Too many at once. Slow down a little.', 429);

  const text = await req.text();
  if (text.length > 512) return fail('Payload too large', 413);
  let body: { tmdbId?: unknown; token?: unknown; website?: unknown };
  try { body = JSON.parse(text); } catch { return fail('Invalid request', 400); }

  // Honeypot: a hidden field only bots fill. Pretend it worked.
  if (typeof body.website === 'string' && body.website.length > 0) return NextResponse.json({ ok: true }, { status: 201 });

  const ipHash = hashIp(ip);
  const token = checkDareToken(body.token, ipHash);
  if (token === 'too-fast') return fail('Slow down a moment, then try again.', 429);
  if (token === 'invalid') return fail('Refresh the page and try again.', 400);

  const tmdbId = Number(body.tmdbId);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || tmdbId > 100_000_000) return fail('Invalid film', 400);

  const service = createServiceClient();
  const now = Date.now();
  const hourAgo = new Date(now - 3_600_000).toISOString();
  const dayAgo = new Date(now - 86_400_000).toISOString();
  const [hour, day, site, existing] = await Promise.all([
    service.from('dare_events').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', hourAgo),
    service.from('dare_events').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', dayAgo),
    service.from('dare_events').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo),
    service.from('dares').select('status').eq('tmdb_id', tmdbId).maybeSingle(),
  ]);
  if (hour.error || day.error || site.error || existing.error) return fail('Suggestions are closed right now.', 503);
  if ((hour.count ?? 0) >= DARE_LIMITS.perHour || (day.count ?? 0) >= DARE_LIMITS.perDay) {
    return fail('That’s enough suggestions for now. Try again later.', 429);
  }
  if ((site.count ?? 0) >= DARE_LIMITS.globalPerDay) return fail('I’ve had enough suggestions for today. Try again tomorrow.', 429);

  const status = (existing.data as { status: string } | null)?.status;
  if (status === 'dismissed') return fail('I already passed on this one.', 409);
  if (status === 'accepted') return fail('Already on my list. I’ll get to it.', 409);
  if (!status) {
    const { count: pending } = await service.from('dares').select('tmdb_id', { count: 'exact', head: true }).eq('status', 'pending');
    if ((pending ?? 0) >= DARE_LIMITS.maxPending) return fail('My list is full right now. Check back soon.', 429);
  }

  if ((await ownerRatedTmdbIds([tmdbId])).has(tmdbId)) return fail('I’ve already rated that one. It’s in the vault.', 409);

  const film = await screenFilm(tmdbId);
  if (!film) return fail('I can only take horror, thriller or sci-fi films that are already out.', 422);

  const { error: eventError } = await service.from('dare_events').insert({ ip_hash: ipHash, tmdb_id: tmdbId });
  if (eventError?.code === '23505') return fail('You’ve already suggested this one.', 409);
  if (eventError) return fail('Suggestions are closed right now.', 503);

  const { error } = await service.rpc('bump_dare', {
    p_tmdb_id: film.id, p_title: film.title, p_year: film.year, p_poster: film.poster_path, p_genres: film.genres,
  });
  if (error) return fail('Couldn’t send that one. Try again.', 500);

  // Keep the event log small: occasionally drop rows older than 30 days.
  if (Math.random() < 0.02) {
    await service.from('dare_events').delete().lt('created_at', new Date(now - 30 * 86_400_000).toISOString());
  }

  return NextResponse.json({ ok: true, title: film.title }, { status: 201 });
}
