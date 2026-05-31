import { NextRequest, NextResponse } from 'next/server';
import { getColumnValues, appendRow } from '@/lib/sheets';
import { COL, DATA_START_ROW, SUBGENRES } from '@/lib/config';
import type { MovieFormData } from '@/lib/types';

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? 'Movies List';

function toNum(v: number | ''): number | '' {
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

export async function POST(req: NextRequest) {
  try {
    const body: MovieFormData = await req.json();

    // ── 1. Validate required fields ───────────────────────────────────────────
    if (!body.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required.' },
        { status: 400 },
      );
    }
    if (!SUBGENRES.includes(body.subgenre as typeof SUBGENRES[number])) {
      return NextResponse.json(
        { success: false, error: 'Please select a valid subgenre.' },
        { status: 400 },
      );
    }

    // ── 2. Duplicate check ────────────────────────────────────────────────────
    const titlesRange = `'${SHEET_NAME}'!B${DATA_START_ROW}:B`;
    const existingTitles = await getColumnValues(titlesRange);
    const titleLower = body.title.trim().toLowerCase();
    const duplicate = existingTitles.some(t => t.toLowerCase() === titleLower);
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: `"${body.title.trim()}" already exists in the sheet.` },
        { status: 409 },
      );
    }

    // ── 3. Calculate total ────────────────────────────────────────────────────
    const total = calcTotal(body);

    // ── 4. Build row (columns A–O, index 0 = col A = blank) ──────────────────
    //    We send 15 values; index 0 (col A) is blank.
    const row: (string | number)[] = new Array(15).fill('');

    row[COL.TITLE         - 1] = body.title.trim();
    row[COL.SUBGENRE      - 1] = body.subgenre;
    row[COL.SECONDARY_TAG - 1] = body.secondaryTag || '';
    row[COL.RECOMMEND     - 1] = body.recommend || '';
    row[COL.ATMOSPHERE    - 1] = toNum(body.atmosphere) ?? '';
    row[COL.STORY         - 1] = toNum(body.story)      ?? '';
    row[COL.CHARACTERS    - 1] = toNum(body.characters) ?? '';
    row[COL.PACING        - 1] = toNum(body.pacing)     ?? '';
    row[COL.VISUALS       - 1] = toNum(body.visuals)    ?? '';
    row[COL.THRILL        - 1] = toNum(body.thrill)     ?? '';
    row[COL.SOUND         - 1] = toNum(body.sound)      ?? '';
    row[COL.IMPACT        - 1] = toNum(body.impact)     ?? '';
    row[COL.TOTAL         - 1] = total !== 0 ? total : '';
    row[COL.BONUS         - 1] = body.bonus ?? 0;

    // ── 5. Append to sheet ────────────────────────────────────────────────────
    const appendRange = `'${SHEET_NAME}'!A:O`;
    await appendRow(appendRange, row);

    return NextResponse.json({ success: true, total });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[add-movie]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
