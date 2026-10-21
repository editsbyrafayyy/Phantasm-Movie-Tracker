import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { OWNER_ID } from '@/lib/guards';

/**
 * Owner gate for admin routes. Authorizes strictly by OWNER_USER_ID
 * (profiles.role is user-editable) and fails closed when it is not configured.
 * Returns an error response to send, or null when the caller is the owner.
 */
export async function ownerOnly(): Promise<NextResponse | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_ID || user.id !== OWNER_ID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}
