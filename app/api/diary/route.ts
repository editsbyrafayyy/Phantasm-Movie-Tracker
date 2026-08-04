import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const movieId = searchParams.get('movie_id');
  const countOnly = searchParams.get('count') === 'true';

  if (movieId && countOnly) {
    const { count, error } = await supabase
      .from('diary_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('movie_id', movieId);

    if (error) {
      console.error('GET /api/diary count error:', error);
      return NextResponse.json({ error: 'Failed to count entries' }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 }, {
      headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' },
    });
  }

  let query = supabase
    .from('diary_entries')
    .select('*, movie:movies (*)')
    .eq('user_id', user.id)
    .order('watched_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (movieId) {
    query = query.eq('movie_id', movieId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('GET /api/diary error:', error);
    return NextResponse.json({ error: 'Failed to fetch diary entries' }, { status: 500 });
  }

  return NextResponse.json({ diary: data ?? [] }, {
    headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=60' },
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { movie_id, watched_at, rewatch, quick_note } = body;

    if (!movie_id) {
      return NextResponse.json({ error: 'movie_id is required' }, { status: 400 });
    }

    const entryData = {
      user_id: user.id,
      movie_id,
      watched_at: watched_at || new Date().toISOString().slice(0, 10),
      rewatch: !!rewatch,
      quick_note: quick_note ? String(quick_note).slice(0, 280) : null,
    };

    const { data, error } = await supabase
      .from('diary_entries')
      .insert(entryData)
      .select('*, movie:movies (*)')
      .single();

    if (error) {
      console.error('POST /api/diary error:', error);
      return NextResponse.json({ error: 'Failed to add diary entry' }, { status: 500 });
    }

    return NextResponse.json({ diary: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/diary exception:', err);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id param is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('diary_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('DELETE /api/diary error:', error);
    return NextResponse.json({ error: 'Failed to delete diary entry' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
