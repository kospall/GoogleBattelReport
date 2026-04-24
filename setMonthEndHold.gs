// ===== 月初卡控 =====
// setMonthEndHold: 每日由時間觸發器執行，當天為當月 1 日時將 L3 設為「月初確認」
// releaseMonthEndHold: 手動更新日期後，透過 Sheets 選單一鍵解除卡控

function setMonthEndHold() {
  var today = new Date();
  if (today.getDate() !== 1) return;

  var ss = SpreadsheetApp.openById('1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs');

  var sheet06 = ss.getSheetByName('06戰報日期區間');
  if (sheet06) {
    sheet06.getRange('L3').setValue('月初確認');
    Logger.log('06戰報日期區間 L3 已設為月初確認');
  }

  var sheet04 = ss.getSheetByName('04戰報日期區間');
  if (sheet04) {
    sheet04.getRange('L3').setValue('月初確認');
    Logger.log('04戰報日期區間 L3 已設為月初確認');
  }
}

function release06MonthEndHold() {
  var ss    = SpreadsheetApp.openById('1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs');
  var sheet = ss.getSheetByName('06戰報日期區間');
  if (!sheet) return;
  updateDateCells_(sheet);
  sheet.getRange('L3').setValue('OFF');
  SpreadsheetApp.flush();
  Logger.log('06戰報日期區間 日期已更新，L3 已解除卡控');
}

function release04MonthEndHold() {
  var ss    = SpreadsheetApp.openById('1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs');
  var sheet = ss.getSheetByName('04戰報日期區間');
  if (!sheet) return;
  updateDateCells_(sheet);
  sheet.getRange('L3').setValue('OFF');
  SpreadsheetApp.flush();
  Logger.log('04戰報日期區間 日期已更新，L3 已解除卡控');
}

// 從 sheet 的 C2 推算並寫入 B3~B6、F3~F6
function updateDateCells_(sheet) {
  var c2 = sheet.getRange('C2').getValue();
  if (!(c2 instanceof Date)) return;

  var oct1 = calcLastOct1_(c2);
  sheet.getRange('B3').setValue(calcMonthStart_(c2));
  sheet.getRange('B4').setValue(calcQuarterStart_(c2));
  sheet.getRange('B5').setValue(oct1);
  sheet.getRange('B6').setValue(oct1);

  var f35 = calcLastDayOfMonthLastYear_(c2);
  sheet.getRange('F3').setValue(f35);
  sheet.getRange('F4').setValue(calcLastDayOfQuarterLastYear_(c2));
  sheet.getRange('F5').setValue(f35);
  sheet.getRange('F6').setValue(calcLastSep30_(c2));
}

// 當月第一天
function calcMonthStart_(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// 當季第一天（1月、4月、7月、10月起算）
function calcQuarterStart_(date) {
  var quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarterStartMonth, 1);
}

// 最近一個 10/1（≤ 基準日）
function calcLastOct1_(date) {
  var year = date.getMonth() >= 9 ? date.getFullYear() : date.getFullYear() - 1;
  return new Date(year, 9, 1);
}

// 去年同月最後一天（F3、F5）
function calcLastDayOfMonthLastYear_(date) {
  return new Date(date.getFullYear() - 1, date.getMonth() + 1, 0);
}

// 去年同季最後一天（F4）
function calcLastDayOfQuarterLastYear_(date) {
  var quarterEndMonth = Math.floor(date.getMonth() / 3) * 3 + 3; // 3, 6, 9, 12（下季第一月）
  return new Date(date.getFullYear() - 1, quarterEndMonth, 0);
}

// 最近一個 9/30（< 基準日，等於時也往前一年）
function calcLastSep30_(date) {
  var sep30ThisYear = new Date(date.getFullYear(), 8, 30);
  return date > sep30ThisYear
    ? sep30ThisYear
    : new Date(date.getFullYear() - 1, 8, 30);
}
