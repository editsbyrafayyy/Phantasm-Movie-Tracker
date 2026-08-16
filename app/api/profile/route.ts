import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AVATAR_OPTIONS, type AvatarOption } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates: { avatar_url?: string | null; display_name?: string | null } = {};

    // Validate avatar_url if provided
    if ('avatar_url' in body) {
      const avatarUrl = body.avatar_url;
      if (avatarUrl !== null && typeof avatarUrl === 'string') {
        const isValid = AVATAR_OPTIONS.includes(avatarUrl as AvatarOption);
        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid avatar selection. Please choose a valid avatar option.' },
            { status: 400 }
          );
        }
        updates.avatar_url = avatarUrl;
      } else if (avatarUrl === null) {
        updates.avatar_url = null;
      } else {
        return NextResponse.json(
          { error: 'Invalid avatar_url type.' },
          { status: 400 }
        );
      }
    }

    // Validate display_name if provided
    if ('display_name' in body) {
      const displayName = body.display_name;
      if (typeof displayName === 'string') {
        updates.display_name = displayName.trim() || null;
      } else if (displayName === null) {
        updates.display_name = null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('[API /api/profile] Update error:', error);
      return NextResponse.json({ error: error.message || 'Failed to update profile.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err: unknown) {
    console.error('[API /api/profile] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
