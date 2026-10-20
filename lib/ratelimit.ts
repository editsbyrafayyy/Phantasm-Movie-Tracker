// lib/ratelimit.ts
// NOTE: in-memory and per-instance — limits are not shared across serverless instances.
const requests = new Map<string, { count: number; reset: number }>();

const PRUNE_INTERVAL_MS = 60_000;
let lastPrune = 0;

function pruneExpired(now: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, entry] of requests) {
    if (now > entry.reset) requests.delete(key);
  }
}

/**
 * Best-effort client IP: first value of x-forwarded-for (trimmed), then x-real-ip.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Returns true if the request is allowed. `bucket` scopes the counter
 * (e.g. route + method) so different endpoints don't share a quota.
 */
export function rateLimit(ip: string, limit = 30, windowMs = 60_000, bucket = 'global'): boolean {
  const now = Date.now();
  pruneExpired(now);
  const key = `${bucket}:${ip}`;
  const entry = requests.get(key);
  if (!entry || now > entry.reset) {
    requests.set(key, { count: 1, reset: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  entry.count++;
  return true;
}
