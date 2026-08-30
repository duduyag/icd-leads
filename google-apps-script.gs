/**
 * ICD ISRAEL Leads → Google Sheets
 * 1. Open https://script.google.com
 * 2. New project
 * 3. Paste this code
 * 4. Set SPREADSHEET_ID below, or leave empty to create/use the active sheet
 * 5. Deploy → New deployment → Web app
 *    Execute as: Me
 *    Who has access: Anyone
 * 6. Copy the Web app URL and send it to דודי העוזר.
 */
const SPREADSHEET_ID = ''; // optional: paste Google Sheet ID here
const SHEET_NAME = 'ICD Leads';
const HEADERS = [
  'תאריך שמירה',
  'שם',
  'טלפון',
  'עיר המרפאה',
  'מאשר קבלת מידע שיווקי ולימודי',
  'DO NOT SEND',
  'אימייל',
  'זמן קליטה בשרת'
];

function isApproved(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'כן' || normalized === '+' || normalized === 'yes' || normalized === 'true';
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SPREADSHEET_ID
      ? SpreadsheetApp.openById(SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    } else {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }

    const p = e.parameter || {};
    const approved = isApproved(p.mailing);
    sheet.appendRow([
      p.savedAt || '',
      p.name || '',
      p.phone || '',
      p.city || '',
      approved ? '+' : '',
      approved ? '' : '+',
      p.email || '',
      new Date()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
