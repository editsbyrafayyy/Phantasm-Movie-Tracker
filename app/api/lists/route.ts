import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

// GET /api/lists — fetch public lists + user's lists
export async function GET() {
  const supabase = createServiceClient();
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();

  try {
    let query = supabase
      .from('lists')
      .select('*, profile:profiles (username, display_name, avatar_url), items:list_items (id, position, movie:movies (*))')
      .order('created_at', { ascending: false });

    if (user) {
      query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data: lists, error } = await query;
    if (error) {
      // If table doesn't exist yet, return empty array gracefully
      return NextResponse.json({ lists: [] });
    }

    return NextResponse.json({ lists: lists ?? [] });
  } catch (err) {
    console.error('GET /api/lists error:', err);
    return NextResponse.json({ lists: [] });
  }
}

// POST /api/lists — create a new custom list
export async function POST(req: NextRequest) {
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, is_public = true, movieIds = [] } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Create list
    const { data: list, error: listError } = await supabase
      .from('lists')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description ? description.trim() : null,
        is_public: !!is_public,
      })
      .select()
      .single();

    if (listError || !list) {
      throw listError || new Error('Failed to create list');
    }

    // 2. Add initial movies if provided
    if (Array.isArray(movieIds) && movieIds.length > 0) {
      const itemsToInsert = movieIds.map((movieId: string, idx: number) => ({
        list_id: list.id,
        movie_id: movieId,
        position: idx,
      }));

      await supabase.from('list_items').insert(itemsToInsert);
    }

    return NextResponse.json({ list });
  } catch (err: any) {
    console.error('POST /api/lists error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create list' }, { status: 500 });
  }
}
