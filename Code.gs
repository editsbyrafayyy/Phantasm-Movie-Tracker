// ═══════════════════════════════════════════════════════════════════════════════
//  MOVIE LOGGER — Google Apps Script
// ═══════════════════════════════════════════════════════════════════════════════

const CFG = {

  SHEET_NAME:  'Movies List',
  DATA_START:  3,           // Row 1 = total count, Row 2 = header, Row 3 = first data row

  COL: {
    TITLE:          2,      // B
    SUBGENRE:       3,      // C
    SECONDARY_TAG:  4,      // D
    RECOMMEND:      5,      // E
    ATMOSPHERE:     6,      // F
    STORY:          7,      // G
    CHARACTERS:     8,      // H
    PACING:         9,      // I
    VISUALS:        10,     // J
    THRILL:         11,     // K
    SOUND:          12,     // L
    IMPACT:         13,     // M
    TOTAL:          14,     // N  (Rating /10)
    BONUS:          15,     // O
  },

  // Sort and border range: B to O only (col A is reserved for the total count)
  BORDER_COL_START: 2,   // B
  BORDER_COL_END:   15,  // O

  SUBGENRES: [
    'Psychological Horror', 'Supernatural Horror', 'Folk Horror',
    'Religious/Occult Horror', 'Creature Feature', 'Slasher',
    'Zombie Horror', 'Survival Horror', 'Found Footage Horror',
    'Sci-Fi Horror', 'Gore/Extreme Horror', 'Horror Comedy',
    'Thriller (Non-Horror)',
  ],

  SECONDARY_TAGS: [
    'Haunted House', 'Possession/Demonic Entities', 'Cults/Rituals',
    'Found Footage', 'Isolation/Claustrophobic Setting',
    'Creature/Monster/Animal Attack', 'Slasher Killer', 'Paranormal Investigation',
    'Apocalyptic/Post-Apocalyptic', 'Body Horror', 'Psychological Breakdown',
  ],

  SUBGENRE_STYLE: {
    'Psychological Horror':    { bg: '#F4CCCC', fg: '#000000' },
    'Supernatural Horror':     { bg: '#FCE5CD', fg: '#000000' },
    'Folk Horror':             { bg: '#D9EAD3', fg: '#000000' },
    'Religious/Occult Horror': { bg: '#D9D2E9', fg: '#000000' },
    'Creature Feature':        { bg: '#CFE2F3', fg: '#000000' },
    'Slasher':                 { bg: '#CC0000', fg: '#FFFFFF' },
    'Zombie Horror':           { bg: '#B6D7A8', fg: '#000000' },
    'Survival Horror':         { bg: '#0B5394', fg: '#FFFFFF' },
    'Found Footage Horror':    { bg: '#7B2FBE', fg: '#FFFFFF' },
    'Sci-Fi Horror':           { bg: '#C9DAF8', fg: '#000000' },
    'Gore/Extreme Horror':     { bg: '#E06666', fg: '#FFFFFF' },
    'Horror Comedy':           { bg: '#FFF2CC', fg: '#000000' },
    'Thriller (Non-Horror)':   { bg: '#1155CC', fg: '#FFFFFF' },
  },

  RECOMMEND_STYLE: {
    'Yes':     { bg: '#6AA84F', fg: '#FFFFFF' },
    'No':      { bg: '#CC0000', fg: '#FFFFFF' },
    'Peak':    { bg: '#7B2FBE', fg: '#FFFFFF' },
    'Garbage': { bg: '#595959', fg: '#FFFFFF' },
  },
};


// ── MENU ─────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎬 Movie Logger')
    .addItem('Open Logger', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  const ui = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('🎬 Movie Logger')
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(ui);
}

// ── SORT ──────────────────────────────────────────────────────────────────────
// Sorts only columns B:O (DATA_START onwards), leaving col A untouched.

function sortMovies() {
  const sheet   = _getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < CFG.DATA_START + 1) return;

  const numRows = lastRow - CFG.DATA_START + 1;
  const numCols = CFG.BORDER_COL_END - CFG.BORDER_COL_START + 1; // B to O

  sheet.getRange(CFG.DATA_START, CFG.BORDER_COL_START, numRows, numCols)
       .sort({ column: CFG.COL.TITLE, ascending: true });
}

// ── CLIENT-FACING DATA FUNCTIONS ─────────────────────────────────────────────

function getConfig() {
  return {
    SUBGENRES:      CFG.SUBGENRES,
    SECONDARY_TAGS: CFG.SECONDARY_TAGS,
    SUBGENRE_STYLE: CFG.SUBGENRE_STYLE,
    HAS_SECONDARY:  CFG.COL.SECONDARY_TAG > 0,
  };
}

function getMovieTitles() {
  const sheet = _getSheet();
  const last  = sheet.getLastRow();
  if (last < CFG.DATA_START) return [];
  return sheet
    .getRange(CFG.DATA_START, CFG.COL.TITLE, last - CFG.DATA_START + 1, 1)
    .getValues()
    .flat()
    .filter(Boolean);
}

function getMovieData(title) {
  const sheet = _getSheet();
  const last  = sheet.getLastRow();
  if (last < CFG.DATA_START) return null;

  const C      = CFG.COL;
  const endCol = Math.max(C.BONUS, C.IMPACT, C.RECOMMEND);
  const rows   = sheet
    .getRange(CFG.DATA_START, 1, last - CFG.DATA_START + 1, endCol)
    .getValues();

  for (const row of rows) {
    if (String(row[C.TITLE - 1]).toLowerCase() === title.toLowerCase()) {
      return {
        recommend:  _str(row[C.RECOMMEND  - 1]),
        atmosphere: _numOrBlank(row[C.ATMOSPHERE - 1]),
        story:      _numOrBlank(row[C.STORY      - 1]),
        characters: _numOrBlank(row[C.CHARACTERS - 1]),
        pacing:     _numOrBlank(row[C.PACING     - 1]),
        visuals:    _numOrBlank(row[C.VISUALS    - 1]),
        thrill:     _numOrBlank(row[C.THRILL     - 1]),
        sound:      _numOrBlank(row[C.SOUND      - 1]),
        impact:     _numOrBlank(row[C.IMPACT     - 1]),
        bonus:      parseInt(row[C.BONUS - 1]) || 0,
      };
    }
  }
  return null;
}


// ── ADD NEW MOVIE ─────────────────────────────────────────────────────────────

function submitMovie(data) {
  try {
    const sheet = _getSheet();
    const C     = CFG.COL;
    const last  = sheet.getLastRow();

    // ── 1. Duplicate check ──
    if (last >= CFG.DATA_START) {
      const titles = sheet
        .getRange(CFG.DATA_START, C.TITLE, last - CFG.DATA_START + 1, 1)
        .getValues().flat().map(t => String(t).toLowerCase());
      if (titles.includes(data.title.toLowerCase())) {
        return { success: false, error: `"${data.title}" already exists in the sheet.` };
      }
    }

    // ── 2. Find alphabetical insert position ──
    let insertRow      = last + 1;
    let insertInMiddle = false;

    if (last >= CFG.DATA_START) {
      const titles = sheet
        .getRange(CFG.DATA_START, C.TITLE, last - CFG.DATA_START + 1, 1)
        .getValues();
      for (let i = 0; i < titles.length; i++) {
        const t = String(titles[i][0]);
        if (t && t.toLowerCase().localeCompare(data.title.toLowerCase()) > 0) {
          insertRow      = i + CFG.DATA_START;
          insertInMiddle = true;
          break;
        }
      }
    }

    // ── 3. Insert row or append ──
    if (insertInMiddle) {
      sheet.insertRowBefore(insertRow);
      _copyValidation(sheet, insertRow - 1, insertRow, [C.SUBGENRE, C.RECOMMEND]);
    }

    // ── 4. Build and write row data ──
    const total   = _calcTotal(data);
    const numCols = _lastDataCol();
    const rowData = new Array(numCols).fill('');

    rowData[C.TITLE      - 1] = data.title;
    rowData[C.SUBGENRE   - 1] = data.subgenre;
    rowData[C.RECOMMEND  - 1] = data.recommend;
    rowData[C.ATMOSPHERE - 1] = _toNum(data.atmosphere);
    rowData[C.STORY      - 1] = _toNum(data.story);
    rowData[C.CHARACTERS - 1] = _toNum(data.characters);
    rowData[C.PACING     - 1] = _toNum(data.pacing);
    rowData[C.VISUALS    - 1] = _toNum(data.visuals);
    rowData[C.THRILL     - 1] = _toNum(data.thrill);
    rowData[C.SOUND      - 1] = _toNum(data.sound);
    rowData[C.IMPACT     - 1] = _toNum(data.impact);
    rowData[C.TOTAL      - 1] = total !== 0 ? total : '';
    rowData[C.BONUS      - 1] = parseInt(data.bonus) || 0;

    if (C.SECONDARY_TAG > 0) {
      rowData[C.SECONDARY_TAG - 1] = data.secondaryTag || '';
    }

    sheet.getRange(insertRow, 1, 1, numCols).setValues([rowData]);

    // ── 5. Apply cell colours ──
    _formatRow(sheet, insertRow, data.subgenre, data.recommend);

    // ── 6. Centre-align all columns from B onward ──
    sheet.getRange(insertRow, CFG.BORDER_COL_START, 1, numCols - CFG.BORDER_COL_START + 1)
         .setHorizontalAlignment('center');

    // ── 7. Apply borders ──
    _applyBordersToRow(sheet, insertRow);

    sortMovies();
    return { success: true, row: insertRow, total };

  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ── UPDATE RATINGS FOR EXISTING MOVIE ────────────────────────────────────────

function updateRatings(data) {
  try {
    const sheet = _getSheet();
    const C     = CFG.COL;
    const last  = sheet.getLastRow();
    if (last < CFG.DATA_START) return { success: false, error: 'Sheet has no data.' };

    const titles = sheet
      .getRange(CFG.DATA_START, C.TITLE, last - CFG.DATA_START + 1, 1)
      .getValues();
    let targetRow = -1;
    for (let i = 0; i < titles.length; i++) {
      if (String(titles[i][0]).toLowerCase() === data.title.toLowerCase()) {
        targetRow = i + CFG.DATA_START;
        break;
      }
    }
    if (targetRow === -1) return { success: false, error: `"${data.title}" not found.` };

    const total = _calcTotal(data);

    const scoreMap = {
      [C.ATMOSPHERE]:  _toNum(data.atmosphere),
      [C.STORY]:       _toNum(data.story),
      [C.CHARACTERS]:  _toNum(data.characters),
      [C.PACING]:      _toNum(data.pacing),
      [C.VISUALS]:     _toNum(data.visuals),
      [C.THRILL]:      _toNum(data.thrill),
      [C.SOUND]:       _toNum(data.sound),
      [C.IMPACT]:      _toNum(data.impact),
      [C.TOTAL]:       total,
      [C.BONUS]:       parseInt(data.bonus) || 0,
    };

    Object.entries(scoreMap).forEach(([col, val]) => {
      sheet.getRange(targetRow, Number(col)).setValue(val);
    });

    if (data.recommend) {
      sheet.getRange(targetRow, C.RECOMMEND).setValue(data.recommend);
      _formatRow(sheet, targetRow, null, data.recommend);
    }

    return { success: true, total };

  } catch (e) {
    return { success: false, error: e.message };
  }
}


// ── PRIVATE HELPERS ───────────────────────────────────────────────────────────

function _getSheet() {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_NAME);
  if (!s) throw new Error(`Sheet "${CFG.SHEET_NAME}" not found. Check CFG.SHEET_NAME.`);
  return s;
}

function _lastDataCol() {
  const C = CFG.COL;
  return Math.max(C.TOTAL, C.BONUS, C.SECONDARY_TAG > 0 ? C.SECONDARY_TAG : 0);
}

function _toNum(v) {
  if (v === '' || v === null || v === undefined) return '';
  const n = parseFloat(v);
  return isNaN(n) ? '' : n;
}

function _numOrBlank(v) {
  const n = parseFloat(v);
  return isNaN(n) ? '' : n;
}

function _str(v) {
  return v == null ? '' : String(v);
}

function _calcTotal(data) {
  const keys  = ['atmosphere','story','characters','pacing','visuals','thrill','sound','impact'];
  const score = keys.reduce((s, k) => s + (parseFloat(data[k]) || 0), 0);
  return Math.round((score + (parseInt(data.bonus) || 0)) * 100) / 100;
}

function _copyValidation(sheet, fromRow, toRow, cols) {
  const last = sheet.getLastRow();
  if (fromRow < CFG.DATA_START || fromRow > last) return;
  cols.forEach(col => {
    try {
      sheet.getRange(fromRow, col).copyTo(
        sheet.getRange(toRow, col),
        SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,
        false
      );
    } catch (_) {}
  });
}

function _formatRow(sheet, row, subgenre, recommend) {
  const C = CFG.COL;
  
  // 1. Force Column B (Column 2) to always be left-aligned
  sheet.getRange(row, 2).setHorizontalAlignment('left');

  // 2. Format Subgenre Column
  if (subgenre && CFG.SUBGENRE_STYLE[subgenre]) {
    const { fg } = CFG.SUBGENRE_STYLE[subgenre];
    sheet.getRange(row, C.SUBGENRE)
         .setBackground('#FFFFFF') // Forces cell background to stay white
         .setFontColor(fg)
         .setHorizontalAlignment('center');
  }
  
  // 3. Format Recommend Column
  if (recommend && CFG.RECOMMEND_STYLE[recommend]) {
    const { fg } = CFG.RECOMMEND_STYLE[recommend];
    sheet.getRange(row, C.RECOMMEND)
         .setBackground('#FFFFFF') // Forces cell background to stay white
         .setFontColor(fg)
         .setHorizontalAlignment('center');
  }
}

// ── BORDER HELPER ─────────────────────────────────────────────────────────────
//
// Border logic:
//
//   Every cell in the data range (col B–O) has a thin black border on all
//   four sides. When a new row is written we:
//
//   1. Apply SOLID borders to all four sides of every cell in the new row
//      (B through O).  This handles left, right, and the row's own
//      top/bottom edges.
//
//   2. Re-stamp the BOTTOM border of the row immediately ABOVE the new row
//      (if it exists and is within the data range).  insertRowBefore() can
//      strip the bottom border from the predecessor row.
//
//   3. Re-stamp the TOP border of the row immediately BELOW the new row
//      (if it exists and is within the data range).  Similarly, the
//      successor's top border can be erased by the insert.
//
//   Result: the grid is seamless regardless of whether the row was inserted
//   in the middle or appended at the end.
//
// NOTE: After sortMovies() is called the physical row numbers change, but
// every row already has all-sides borders so no re-repair is needed post-sort.

function _applyBordersToRow(sheet, row) {
  const colStart = CFG.BORDER_COL_START;   // B = 2
  const colEnd   = CFG.BORDER_COL_END;     // O = 15
  const numCols  = colEnd - colStart + 1;

  const SOLID = SpreadsheetApp.BorderStyle.SOLID;

  // 1. Full border on the new row itself
  sheet.getRange(row, colStart, 1, numCols)
       .setBorder(true, true, true, true, true, true, '#000000', SOLID);

  // 2. Repair the bottom border of the row above (if in data range)
  const rowAbove = row - 1;
  if (rowAbove >= CFG.DATA_START) {
    sheet.getRange(rowAbove, colStart, 1, numCols)
         .setBorder(null, null, true, null, null, null, '#000000', SOLID);
  }

  // 3. Repair the top border of the row below (if it has data)
  const rowBelow = row + 1;
  const lastRow  = sheet.getLastRow();
  if (rowBelow <= lastRow) {
    sheet.getRange(rowBelow, colStart, 1, numCols)
         .setBorder(true, null, null, null, null, null, '#000000', SOLID);
  }
}

function debugTitles() {
  const sheet = _getSheet();
  const last  = sheet.getLastRow();
  const start = CFG.DATA_START;
  const col   = CFG.COL.TITLE;

  Logger.log('Sheet name: ' + sheet.getName());
  Logger.log('Last row: ' + last);
  Logger.log('DATA_START: ' + start);
  Logger.log('TITLE col: ' + col);

  if (last < start) {
    Logger.log('ERROR: lastRow (' + last + ') is less than DATA_START (' + start + ') — sheet appears empty to the script');
    return;
  }

  const values = sheet
    .getRange(start, col, last - start + 1, 1)
    .getValues();

  Logger.log('Raw values from title column:');
  values.forEach((row, i) => {
    Logger.log('Row ' + (start + i) + ': [' + typeof row[0] + '] "' + row[0] + '"');
  });
}
