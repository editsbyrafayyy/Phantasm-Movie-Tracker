import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { OWNER_ID } from '@/lib/guards';

export async function POST(request: Request) {
  try {
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

    const { userId, newPassword } = await request.json();

    if (
      typeof userId !== 'string' ||
      typeof newPassword !== 'string' ||
      newPassword.length < 6
    ) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Use the service client to force update the user's password
    const serviceClient = createServiceClient();
    const { error } = await serviceClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error('[POST /api/admin/reset-user-password]', error);
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/admin/reset-user-password] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
