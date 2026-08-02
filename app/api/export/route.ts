import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Entry } from '@/lib/types';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'csv';

  const { data: entries, error } = await supabase
    .from('entries')
    .select('*, movie:movies (*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET /api/export error:', error);
    return NextResponse.json({ error: 'Failed to export entries' }, { status: 500 });
  }

  const typedEntries = (entries ?? []) as Entry[];

  if (format === 'json') {
    const jsonStr = JSON.stringify(typedEntries, null, 2);
    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="vault-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  // Generate CSV
  const headers = [
    'Title',
    'Year',
    'Director',
    'Runtime (min)',
    'IMDb ID',
    'TMDB ID',
    'Subgenre',
    'Secondary Tag',
    'Recommend',
    'Atmosphere',
    'Story',
    'Characters',
    'Pacing',
    'Visuals',
    'Thrill',
    'Sound',
    'Impact',
    'Bonus',
    'Total Score',
    'Must Watch',
    'Notes',
    'Logged At',
  ];

  function escapeCsv(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  const csvRows = [headers.join(',')];

  for (const entry of typedEntries) {
    const m = entry.movie ?? {};
    const row = [
      escapeCsv(m.title),
      escapeCsv(m.year),
      escapeCsv(m.director),
      escapeCsv(m.runtime_min),
      escapeCsv(m.omdb_id),
      escapeCsv(m.tmdb_id),
      escapeCsv(entry.subgenre),
      escapeCsv(entry.secondary_tag),
      escapeCsv(entry.recommend),
      escapeCsv(entry.atmosphere),
      escapeCsv(entry.story),
      escapeCsv(entry.characters),
      escapeCsv(entry.pacing),
      escapeCsv(entry.visuals),
      escapeCsv(entry.thrill),
      escapeCsv(entry.sound),
      escapeCsv(entry.impact),
      escapeCsv(entry.bonus),
      escapeCsv(entry.total),
      escapeCsv(entry.must_watch ? 'Yes' : 'No'),
      escapeCsv(entry.notes),
      escapeCsv(entry.created_at),
    ];
    csvRows.push(row.join(','));
  }

  const csvStr = csvRows.join('\n');

  return new NextResponse(csvStr, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="vault-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
