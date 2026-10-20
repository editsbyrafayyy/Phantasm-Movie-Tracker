import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

// GET /api/lists/[id] — get single list
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();

  const supabase = createServiceClient();

  const { data: list, error } = await supabase
    .from('lists')
    .select('*, profile:profiles (username, display_name, avatar_url), items:list_items (id, position, movie:movies (*))')
    .eq('id', id)
    .single();

  if (error || !list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  }

  // Enforce privacy: only public lists or lists owned by the requesting user can be viewed
  if (!list.is_public && list.user_id !== user?.id) {
    return NextResponse.json({ error: 'List not found or private' }, { status: 404 });
  }

  return NextResponse.json({ list });
}

// PATCH /api/lists/[id] — update list title/description or add/remove movies
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: list } = await supabase
    .from('lists')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!list || list.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, is_public, addMovieId, removeMovieId } = body;

    // 1. Update metadata if provided
    const updatePayload: Record<string, unknown> = {};
    if (typeof title === 'string' && title.trim()) updatePayload.title = title.trim();
    if (typeof description === 'string') updatePayload.description = description.trim();
    if (typeof is_public === 'boolean') updatePayload.is_public = is_public;

    if (Object.keys(updatePayload).length > 0) {
      updatePayload.updated_at = new Date().toISOString();
      const { error: updateError } = await supabase.from('lists').update(updatePayload).eq('id', id);
      if (updateError) {
        console.error('PATCH /api/lists/[id] update error:', updateError);
        return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
      }
    }

    // 2. Add movie to list if requested
    if (addMovieId) {
      // Get current max position
      const { data: items } = await supabase
        .from('list_items')
        .select('position')
        .eq('list_id', id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPos = (items?.[0]?.position ?? -1) + 1;

      const { error: addError } = await supabase.from('list_items').upsert({
        list_id: id,
        movie_id: addMovieId,
        position: nextPos,
      }, { onConflict: 'list_id,movie_id' });
      if (addError) {
        console.error('PATCH /api/lists/[id] add item error:', addError);
        return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
      }
    }

    // 3. Remove movie from list if requested
    if (removeMovieId) {
      const { error: removeError } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', id)
        .eq('movie_id', removeMovieId);
      if (removeError) {
        console.error('PATCH /api/lists/[id] remove item error:', removeError);
        return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/lists/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

// DELETE /api/lists/[id] — delete list
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: list } = await supabase
    .from('lists')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!list || list.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteError } = await supabase.from('lists').delete().eq('id', id);
  if (deleteError) {
    console.error('DELETE /api/lists/[id] error:', deleteError);
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
