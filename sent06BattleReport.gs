// ===== 06戰報寄送 =====
// 從 Google Sheets 匯出指定工作表為 PDF + Excel，透過 Gmail 寄出
// 控制頁：06戰報日期區間
//   L1 = 寄信開關（ON = 允許寄送）
//   L2 = 資料時間（顯示用）
//   L3 = 強制停止（OFF = 正常）
//   L4 = 執行狀態（寄送處理中 / 寄送成功MMDDHHMMSS / 寄送失敗MMDDHHMMSS）
//   N1 = 額外收件人（空白則只寄基本收件人）
//   N2 = 信件標題附加說明
//   N3 = 信件內容附加說明
//   C2 = 戰報日期（YYYY/MM/DD，用於檔名與信件標題）

function sent06BattleReport() {
  var spreadsheetId   = '1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs';
  var sheetName       = '06戰報製作區';
  var controlSheetName = '06戰報日期區間';
  var updateSheetName  = '資料寫入紀錄與判定';

  var ss            = SpreadsheetApp.openById(spreadsheetId);
  var controlSheet  = ss.getSheetByName(controlSheetName);
  if (!controlSheet) return;
  var updateSheet   = ss.getSheetByName(updateSheetName);

  // ---- 寄信卡控檢核 ----
  var flagL1   = controlSheet.getRange('L1').getValue();
  var flagL3   = controlSheet.getRange('L3').getValue();
  var upflagF1 = updateSheet.getRange('F1').getValue().toString().trim();
  var upflagH1 = updateSheet.getRange('H1').getValue().toString().trim();

  if (flagL1 !== 'ON') {
    Logger.log('寄信開關未開啟');
    return;
  }
  if (flagL3 !== 'OFF') {
    Logger.log('強制停止寄出');
    return;
  }
  if (upflagF1 !== '') {
    Logger.log('業績明細更新中。。。');
    return;
  }
  if (upflagH1 !== '') {
    Logger.log('客戶資料更新中。。。');
    return;
  }

  // ---- 取得腳本層級互斥鎖，最多等待 5 秒 ----
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (e) {
    Logger.log('無法取得鎖定，略過本次執行');
    return;
  }

  // 在鎖定內做「檢查 + 標記」，確保原子性
  try {
    var n2Status = controlSheet.getRange('L4').getValue().toString().trim();
    if (n2Status === '寄送處理中') {
      Logger.log('已有寄送處理中，略過本次執行');
      return;
    }
    controlSheet.getRange('L4').setValue('寄送處理中');
    SpreadsheetApp.flush();
    Logger.log('L4已寫入處理中');
  } finally {
    lock.releaseLock();
  }

  // ---- 收件人：固定 + 06戰報日期區間 N1 動態 ----
  var baseRecipient = 'shaojyun.hong@bingdian.com.tw';
  var n1Recipient   = controlSheet.getRange('N1').getValue().toString().trim();
  var recipient     = n1Recipient ? baseRecipient + ',' + n1Recipient : baseRecipient;

  var subjectdate   = formatDate_(controlSheet.getRange('C2').getValue());         // YYYY/MM/DD
  var dateRangeText = formatDateTime_(controlSheet.getRange('L2').getValue());     // YYYY/MM/DD HH:MM:SS
  var sheetTabName  = formatDateCompact_(controlSheet.getRange('C2').getValue());  // YYYYMMDD（xlsx 分頁名）

  var subjectnote = controlSheet.getRange('N2').getValue().toString();
  var bodynote    = controlSheet.getRange('N3').getValue().toString();

  var subject  = subjectdate + '業績戰報寄送 ' + subjectnote + '- ' + dateRangeText;
  var body     = '您好，附件為' + subjectdate + '業績戰報的 PDF 與 Excel，' + bodynote +
                 '資料時間為:（' + dateRangeText + '），請查收。';
  var fileName = controlSheet.getRange('C2').getDisplayValue() + '業績戰報';

  Logger.log('寄信到:' + recipient);
  Logger.log('信件標題' + subjectnote);
  Logger.log('信件內容' + bodynote);

  try {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      controlSheet.getRange('L4').setValue('寄送失敗' + getTimestamp_());
      SpreadsheetApp.flush();
      return;
    }

    // ---- PDF 匯出 ----
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    var pdfUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?' +
                 'exportFormat=pdf&format=pdf' +
                 '&size=custom' +
                 '&pageWidth=9.0' +
                 '&pageHeight=4.0' +
                 '&portrait=false' +
                 '&fitw=true' +
                 '&fith=true' +
                 '&sheetnames=false' +
                 '&printtitle=false' +
                 '&pagenumbers=false' +
                 '&gridlines=false' +
                 '&fzr=false' +
                 '&top_margin=0.25' +
                 '&bottom_margin=0.25' +
                 '&left_margin=0.25' +
                 '&right_margin=0.25' +
                 '&r1=0' +
                 '&c1=0' +
                 '&r2=' + lastRow +
                 '&c2=' + lastCol +
                 '&gid=' + sheet.getSheetId();

    var pdfBlob = UrlFetchApp.fetch(pdfUrl, {
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }
    }).getBlob().setName(fileName + '.pdf');

    // ---- Excel 匯出 ----
    var tempSS      = SpreadsheetApp.create('Temp_' + sheetName);
    var copiedSheet = sheet.copyTo(tempSS).setName(sheetTabName);  // 分頁名為 YYYYMMDD

    var defaultSheet = tempSS.getSheets()[0];
    if (defaultSheet.getName() !== sheetTabName) {
      tempSS.deleteSheet(defaultSheet);
    }

    var values = sheet.getDataRange().getDisplayValues();
    copiedSheet.getRange(1, 1, values.length, values[0].length).setValues(values);

    for (var r = 1; r <= values.length; r++) {
      copiedSheet.setRowHeight(r, sheet.getRowHeight(r));
    }
    for (var c = 1; c <= values[0].length; c++) {
      copiedSheet.setColumnWidth(c, sheet.getColumnWidth(c));
    }

    SpreadsheetApp.flush();

    var excelUrl  = 'https://docs.google.com/spreadsheets/d/' + tempSS.getId() + '/export?exportFormat=xlsx';
    var excelBlob = UrlFetchApp.fetch(excelUrl, {
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }
    }).getBlob().setName(fileName + '.xlsx');

    // ---- 寄出 Email ----
    GmailApp.sendEmail(recipient, subject, body, { attachments: [pdfBlob, excelBlob] });

    // ---- 刪除暫存 Spreadsheet ----
    DriveApp.getFileById(tempSS.getId()).setTrashed(true);

    // ---- 更新狀態 ----
    controlSheet.getRange('L1').setValue('OFF');
    controlSheet.getRange('L4').setValue('寄送成功' + getTimestamp_());
    SpreadsheetApp.flush();
    Logger.log('寄送成功' + getTimestamp_());
    Logger.log('06戰報已寄送，L1 已改為 OFF');

  } catch (e) {
    Logger.log('寄送失敗: ' + e.message);
    controlSheet.getRange('L4').setValue('寄送失敗' + getTimestamp_());
    SpreadsheetApp.flush();
    Logger.log('寄送失敗' + getTimestamp_());
  }
}

// ===== 工具函式 =====

function formatDate_(date) {
  if (!(date instanceof Date)) return String(date);
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return date.getFullYear() + '/' + pad(date.getMonth() + 1) + '/' + pad(date.getDate());
}

function formatDateTime_(date) {
  if (!(date instanceof Date)) return String(date);
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return date.getFullYear() + '/' + pad(date.getMonth() + 1) + '/' + pad(date.getDate()) +
         ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}

function formatDateCompact_(date) {
  if (!(date instanceof Date)) return String(date);
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return String(date.getFullYear()) + pad(date.getMonth() + 1) + pad(date.getDate());
}

function getTimestamp_() {
  var now = new Date();
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return pad(now.getMonth() + 1) +
         pad(now.getDate()) +
         pad(now.getHours()) +
         pad(now.getMinutes()) +
         pad(now.getSeconds());
}
