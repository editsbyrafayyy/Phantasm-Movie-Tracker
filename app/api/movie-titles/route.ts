import { NextResponse } from 'next/server';
import { getColumnValues } from '@/lib/sheets';
import { DATA_START_ROW } from '@/lib/config';

export const dynamic = 'force-dynamic';

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? 'Movies List';

export async function GET() {
  try {
    const titlesRange = `'${SHEET_NAME}'!B${DATA_START_ROW}:B`;
    const titles = await getColumnValues(titlesRange);
    
    // Filter out blanks
    const validTitles = titles.filter(t => t.trim().length > 0);
    
    return NextResponse.json({ success: true, titles: validTitles });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[movie-titles]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
