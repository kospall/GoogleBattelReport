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

function releaseMonthEndHold() {
  var ss      = SpreadsheetApp.openById('1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs');
  var sheet06 = ss.getSheetByName('06戰報日期區間');
  var sheet04 = ss.getSheetByName('04戰報日期區間');

  // ---- 從 06 的 C2 讀取基準日期並推算各欄位 ----
  if (sheet06) {
    var c2 = sheet06.getRange('C2').getValue();
    if (c2 instanceof Date) {
      var b3 = calcMonthStart_(c2);
      var b4 = calcQuarterStart_(c2);
      var b5 = calcLastOct1_(c2);
      sheet06.getRange('B3').setValue(b3);
      sheet06.getRange('B4').setValue(b4);
      sheet06.getRange('B5').setValue(b5);
      sheet06.getRange('B6').setValue(b5);
      Logger.log('06戰報日期區間 B3~B6 已更新');
    }
    sheet06.getRange('L3').setValue('OFF');
    Logger.log('06戰報日期區間 L3 已解除卡控');
  }

  if (sheet04) {
    sheet04.getRange('L3').setValue('OFF');
    Logger.log('04戰報日期區間 L3 已解除卡控');
  }

  SpreadsheetApp.flush();
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
