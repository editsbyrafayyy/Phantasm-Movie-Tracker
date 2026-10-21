import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { ownerOnly } from '../_owner';

/** POST: drop the cached owner vault so home, vault and stream pick up changes now. */
export async function POST() {
  const denied = await ownerOnly();
  if (denied) return denied;
  revalidateTag('owner-entries', { expire: 0 });
  return NextResponse.json({ success: true });
}
