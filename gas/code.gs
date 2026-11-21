/** @OnlyCurrentDoc */

// ダッシュボードの「メモ」カードに、スプレッドシートの中身を JSON で渡す
// 1枚目のシートの A1 が見出し、A2 から下が中身（空のセルは飛ばす）
//
// 返す形: { "title": "見出し", "items": ["1行目", "2行目", ...] }
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const title = sheet.getRange("A1").getDisplayValue();

  const lastRow = sheet.getLastRow();
  const items = lastRow >= 2
    ? sheet.getRange(2, 1, lastRow - 1, 1)
        .getDisplayValues()
        .map((row) => row[0])
        .filter((text) => text !== "")
    : [];

  return ContentService
    .createTextOutput(JSON.stringify({ title, items }))
    .setMimeType(ContentService.MimeType.JSON);
}
