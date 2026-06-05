// lib/ratelimit.ts
const requests = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now > entry.reset) {
    requests.set(ip, { count: 1, reset: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  entry.count++;
  return true;
}
