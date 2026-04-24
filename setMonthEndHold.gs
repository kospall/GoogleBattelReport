// ===== 月底卡控 =====
// setMonthEndHold: 每日由時間觸發器執行，當天為最後一個工作日時將 L3 設為「月底確認」
// releaseMonthEndHold: 手動更新日期後，透過 Sheets 選單一鍵解除卡控

function setMonthEndHold() {
  var today = new Date();
  if (!isLastWorkdayOfMonth_(today)) return;

  var ss = SpreadsheetApp.openById('1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs');

  var sheet06 = ss.getSheetByName('06戰報日期區間');
  if (sheet06) {
    sheet06.getRange('L3').setValue('月底確認');
    Logger.log('06戰報日期區間 L3 已設為月底確認');
  }

  var sheet04 = ss.getSheetByName('04戰報日期區間');
  if (sheet04) {
    sheet04.getRange('L3').setValue('月底確認');
    Logger.log('04戰報日期區間 L3 已設為月底確認');
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

// 判斷 date 是否為當月最後一個工作日（週一～週五）
function isLastWorkdayOfMonth_(date) {
  var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  while (lastDay.getDay() === 0 || lastDay.getDay() === 6) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  return date.getDate()     === lastDay.getDate()  &&
         date.getMonth()    === lastDay.getMonth()  &&
         date.getFullYear() === lastDay.getFullYear();
}
