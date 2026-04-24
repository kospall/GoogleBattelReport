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
  var ss = SpreadsheetApp.openById('1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs');

  var sheet06 = ss.getSheetByName('06戰報日期區間');
  if (sheet06) {
    sheet06.getRange('L3').setValue('OFF');
    Logger.log('06戰報日期區間 L3 已解除卡控');
  }

  var sheet04 = ss.getSheetByName('04戰報日期區間');
  if (sheet04) {
    sheet04.getRange('L3').setValue('OFF');
    Logger.log('04戰報日期區間 L3 已解除卡控');
  }
}
