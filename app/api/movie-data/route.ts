import { NextRequest, NextResponse } from 'next/server';
import { getValues } from '@/lib/sheets';
import { COL, DATA_START_ROW } from '@/lib/config';

export const dynamic = 'force-dynamic';

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? 'Movies List';

function numOrBlank(v: string | undefined): number | '' {
  if (v === '' || v === undefined || v === null) return '';
  const n = parseFloat(v);
  return isNaN(n) ? '' : n;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title parameter is required.' },
        { status: 400 },
      );
    }

    // Read all columns from A to O
    const range = `'${SHEET_NAME}'!A${DATA_START_ROW}:O`;
    const rows = await getValues(range);
    const titleLower = title.trim().toLowerCase();

    // Find the row
    for (const row of rows) {
      const rowTitle = row[COL.TITLE - 1] ?? '';
      if (String(rowTitle).toLowerCase() === titleLower) {
        return NextResponse.json({
          success: true,
          data: {
            recommend:  row[COL.RECOMMEND - 1] ?? '',
            subgenre:   row[COL.SUBGENRE - 1] ?? '',
            secondaryTag: row[COL.SECONDARY_TAG - 1] ?? '',
            atmosphere: numOrBlank(row[COL.ATMOSPHERE - 1]),
            story:      numOrBlank(row[COL.STORY - 1]),
            characters: numOrBlank(row[COL.CHARACTERS - 1]),
            pacing:     numOrBlank(row[COL.PACING - 1]),
            visuals:    numOrBlank(row[COL.VISUALS - 1]),
            thrill:     numOrBlank(row[COL.THRILL - 1]),
            sound:      numOrBlank(row[COL.SOUND - 1]),
            impact:     numOrBlank(row[COL.IMPACT - 1]),
            bonus:      parseInt(row[COL.BONUS - 1]) || 0,
            total:      numOrBlank(row[COL.TOTAL - 1]),
          }
        });
      }
    }

    return NextResponse.json(
      { success: false, error: `Movie "${title}" not found.` },
      { status: 404 }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[movie-data]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
