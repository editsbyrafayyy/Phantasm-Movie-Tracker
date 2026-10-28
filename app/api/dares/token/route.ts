import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import { hashIp, issueDareToken } from '@/lib/dares';

/** GET: a signed, visitor-bound timestamp the dare form must send back (time trap). */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 20, 60_000, 'GET /api/dares/token')) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  return NextResponse.json({ token: issueDareToken(hashIp(ip)) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
