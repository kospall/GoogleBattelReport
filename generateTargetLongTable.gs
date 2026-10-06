// ============================================================
// 產生目標直列表
// 將「交叉轉直列專用表」A~O 的 路線 × 月份 交叉表，
// 轉成直列格式寫入同工作表的 T~X 欄：路線 / 負責人 / 屬性 / 值 / 日期驗證
// ============================================================

const TARGET_SHEET_NAME_ = '交叉轉直列專用表';
const TARGET_SRC_FIRST_MONTH_COL_ = 4;   // D 欄：第一個月份欄
const TARGET_OUT_START_COL_ = 20;        // T 欄：輸出起點
const TARGET_OUT_COLS_ = 5;              // T~X

function generateTargetLongTable() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TARGET_SHEET_NAME_);
  if (!sheet) {
    ui.alert('找不到工作表「' + TARGET_SHEET_NAME_ + '」');
    return;
  }

  // 來源範圍：A1 起，到 A~O 內最後一列有路線的列（月份欄寬度由表頭決定）
  const srcLastRow = sheet.getLastRow();
  const srcLastCol = TARGET_OUT_START_COL_ - 1; // 只讀到 S 欄，避免讀到輸出區
  const src = sheet.getRange(1, 1, srcLastRow, srcLastCol).getValues();

  // 月份表頭：從 D1 起連續有值的欄
  const header = src[0];
  const months = [];
  for (let c = TARGET_SRC_FIRST_MONTH_COL_ - 1; c < header.length; c++) {
    if (!(header[c] instanceof Date)) break;
    months.push({ col: c, date: header[c] });
  }
  if (months.length === 0) {
    ui.alert('D1 起找不到月份日期表頭，無法產生');
    return;
  }

  // 逐列轉換；輸出不含部門，故不需處理 A 欄合併儲存格
  const out = [];
  for (let r = 1; r < src.length; r++) {
    const row = src[r];
    const route = row[1];
    if (route === '' || route == null) continue;

    months.forEach(function (m) {
      out.push([String(route), row[2], m.date, row[m.col]]);
    });
  }
  if (out.length === 0) {
    ui.alert('沒有可轉換的路線資料');
    return;
  }

  // 清空舊資料再寫入
  sheet.getRange(1, TARGET_OUT_START_COL_, sheet.getMaxRows(), TARGET_OUT_COLS_).clearContent();

  sheet.getRange(1, TARGET_OUT_START_COL_, 1, TARGET_OUT_COLS_)
    .setValues([['路線', '負責人', '屬性', '值', '日期驗證']]);

  // 路線欄先設為純文字，避免 33、55 被轉成數字
  sheet.getRange(2, TARGET_OUT_START_COL_, out.length, 1).setNumberFormat('@');
  sheet.getRange(2, TARGET_OUT_START_COL_, out.length, 4).setValues(out);

  // 屬性：日期；值：千分位；日期驗證：公式（以 TEXT 轉字串，日期或字串皆可被 DATEVALUE 解析）
  sheet.getRange(2, TARGET_OUT_START_COL_ + 2, out.length, 1).setNumberFormat('yyyy/m/d');
  sheet.getRange(2, TARGET_OUT_START_COL_ + 3, out.length, 1).setNumberFormat('#,##0');
  const formulas = [];
  for (let i = 0; i < out.length; i++) {
    formulas.push(['=DATEVALUE(TEXT($V' + (i + 2) + ',"yyyy/m/d"))']);
  }
  sheet.getRange(2, TARGET_OUT_START_COL_ + 4, out.length, 1)
    .setFormulas(formulas)
    .setNumberFormat('yyyy/m/d');

  ui.alert('已產生目標直列表：' + out.length + ' 筆（' +
    (out.length / months.length) + ' 條路線 × ' + months.length + ' 個月），位置 T~X 欄');
}
