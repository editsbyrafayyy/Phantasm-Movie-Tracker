import { NextRequest, NextResponse } from 'next/server';
import { getValues, updateRow } from '@/lib/sheets';
import { COL, DATA_START_ROW } from '@/lib/config';
import type { MovieFormData } from '@/lib/types';

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? 'Movies List';

function toNum(v: number | '' | undefined): number | '' {
  if (v === '' || v === null || v === undefined) return '';
  const n = parseFloat(String(v));
  return isNaN(n) ? '' : n;
}

function calcTotal(data: MovieFormData): number {
  const keys: Array<keyof MovieFormData> = [
    'atmosphere', 'story', 'characters', 'pacing',
    'visuals', 'thrill', 'sound', 'impact',
  ];
  const score = keys.reduce((sum, k) => {
    const v = data[k];
    return sum + (typeof v === 'number' ? v : 0);
  }, 0);
  return Math.round((score + (data.bonus ?? 0)) * 100) / 100;
}

export async function PATCH(req: NextRequest) {
  try {
    const body: MovieFormData = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required.' },
        { status: 400 },
      );
    }

    // ── 1. Find the target row index ─────────────────────────────────────────
    const range = `'${SHEET_NAME}'!A${DATA_START_ROW}:O`;
    const rows = await getValues(range);
    
    const titleLower = body.title.trim().toLowerCase();
    let targetRowIndex = -1;
    let existingRowData: any[] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const rowTitle = rows[i][COL.TITLE - 1] ?? '';
      if (String(rowTitle).toLowerCase() === titleLower) {
        targetRowIndex = i + DATA_START_ROW;
        // Pad the row out to 15 columns if it's short
        existingRowData = [...rows[i]];
        while (existingRowData.length < 15) {
          existingRowData.push('');
        }
        break;
      }
    }

    if (targetRowIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Movie "${body.title}" not found.` },
        { status: 404 }
      );
    }

    // ── 2. Calculate new total ───────────────────────────────────────────────
    const total = calcTotal(body);

    // ── 3. Update the specific columns while keeping others untouched ────────
    // Reconstruct the full row
    const updatedRow = [...existingRowData];
    
    updatedRow[COL.RECOMMEND - 1] = body.recommend || '';
    updatedRow[COL.ATMOSPHERE - 1] = toNum(body.atmosphere) ?? '';
    updatedRow[COL.STORY - 1] = toNum(body.story) ?? '';
    updatedRow[COL.CHARACTERS - 1] = toNum(body.characters) ?? '';
    updatedRow[COL.PACING - 1] = toNum(body.pacing) ?? '';
    updatedRow[COL.VISUALS - 1] = toNum(body.visuals) ?? '';
    updatedRow[COL.THRILL - 1] = toNum(body.thrill) ?? '';
    updatedRow[COL.SOUND - 1] = toNum(body.sound) ?? '';
    updatedRow[COL.IMPACT - 1] = toNum(body.impact) ?? '';
    updatedRow[COL.BONUS - 1] = body.bonus ?? 0;
    updatedRow[COL.TOTAL - 1] = total !== 0 ? total : '';

    // ── 4. Write back to sheet ───────────────────────────────────────────────
    const updateRange = `'${SHEET_NAME}'!A${targetRowIndex}:O${targetRowIndex}`;
    await updateRow(updateRange, updatedRow);

    return NextResponse.json({ success: true, total });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[update-movie]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
