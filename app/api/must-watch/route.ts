import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('entries')
    .select('*, movie:movies(*)')
    .eq('must_watch', true)
    .order('total', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'private, no-store' }
  });
}
