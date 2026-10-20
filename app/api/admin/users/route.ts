import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { OWNER_ID } from '@/lib/guards';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
    // Owner check: authorize strictly by OWNER_USER_ID (profiles.role is user-editable).
    // Fails closed when OWNER_USER_ID is not configured.
    const isOwner = !!OWNER_ID && user.id === OWNER_ID;

  if (!isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use the service client to fetch all profiles
  const serviceClient = createServiceClient();
  const { data: users, error } = await serviceClient
    .from('profiles')
    .select('id, username, display_name, role')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/admin/users]', error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }

  return NextResponse.json(users);
}
