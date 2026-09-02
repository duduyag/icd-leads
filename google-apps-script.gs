const SPREADSHEET_ID = ''; // אפשר להשאיר ריק
const SHEET_NAME = 'ICD Leads';

function getSpreadsheet_() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty('ICD_LEADS_SPREADSHEET_ID');

  if (savedId) {
    return SpreadsheetApp.openById(savedId);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('ICD_LEADS_SPREADSHEET_ID', active.getId());
    return active;
  }

  const created = SpreadsheetApp.create('ICD ISRAEL Leads');
  props.setProperty('ICD_LEADS_SPREADSHEET_ID', created.getId());
  return created;
}

function getSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'תאריך שמירה',
      'שם',
      'הערות',
      'טלפון',
      'עיר המרפאה',
      'הצטרפות לדיוור',
      'אימייל',
      'זמן קליטה בשרת',
      'ימי פעילות של המרפאה'
    ]);
  } else {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headers.indexOf('הערות') === -1) {
      sheet.insertColumnAfter(2);
      sheet.getRange(1, 3).setValue('הערות');
    }
  }

  return sheet;
}

// מוסיף "ד״ר " לתחילת השם אם הוא עוד לא שם, בכל וריאציית כתיב
function normalizeDoctorName_(rawName) {
  const name = (rawName || '').toString().trim();
  if (!name) return name;

  const alreadyHasPrefix = /^ד["'׳״]?ר\.?\s+/.test(name);
  if (alreadyHasPrefix) {
    return name;
  }

  return 'ד״ר ' + name;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const p = e.parameter || {};
    const sheet = getSheet_();

    sheet.appendRow([
      p.savedAt || '',
      normalizeDoctorName_(p.name),
      p.notes || '',
      p.phone || '',
      p.city || '',
      p.mailing || '',
      p.email || '',
      new Date(),
      p.activityDays || ''
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

function doGet() {
  const ss = getSpreadsheet_();

  return ContentService
    .createTextOutput('ICD Leads script is working. Spreadsheet: ' + ss.getUrl())
    .setMimeType(ContentService.MimeType.TEXT);
}
