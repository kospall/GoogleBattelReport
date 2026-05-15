// ===== 資料匯出 =====
// 將工作表內容以顯示值（無公式）匯出為 xlsx
// - 從 Sheets 選單執行：彈出對話框直接觸發瀏覽器下載
// - 從 Apps Script 編輯器執行：儲存至指定 Drive 資料夾並記錄 URL
//
// exportSalesData    → 業績明細
// exportCustomerData → 客戶明細

var EXPORT_FOLDER_ID = '1dWfBpk7sdH5Qag1MI8MUXXhgBPBUAO93';

function exportSalesData() {
  exportSheetToExcel_('業績明細', '業績明細');
}

function exportCustomerData() {
  exportSheetToExcel_('客戶明細', '客戶明細');
}

// ===== 共用匯出邏輯 =====

function exportSheetToExcel_(sheetName, filePrefix) {
  var startTime = new Date();
  Logger.log('[開始] 匯出 ' + sheetName + ' — ' + startTime.toLocaleTimeString());

  var spreadsheetId = '1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs';
  var ss    = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log('[錯誤] 找不到工作表：' + sheetName);
    return;
  }

  var dataRange = sheet.getDataRange();
  var rowCount  = dataRange.getNumRows();
  var colCount  = dataRange.getNumColumns();
  Logger.log('[資訊] 工作表大小：' + rowCount + ' 列 × ' + colCount + ' 欄');

  if (rowCount === 0) {
    Logger.log('[錯誤] ' + sheetName + ' 工作表無資料。');
    return;
  }

  var fileName = getExportDate_() + ' ' + filePrefix;

  // ---- 步驟 1：讀取顯示值 ----
  var t1 = new Date();
  var values = dataRange.getDisplayValues();
  Logger.log('[步驟1] getDisplayValues 完成 — ' + elapsed_(t1) + '秒');

  // ---- 步驟 2：建立暫存試算表 ----
  var t2 = new Date();
  var tempSS = SpreadsheetApp.create('Temp_' + sheetName);
  Logger.log('[步驟2] 建立暫存試算表完成 — ' + elapsed_(t2) + '秒，ID=' + tempSS.getId());

  var blob;

  try {
    // ---- 步驟 3：寫入值 ----
    var t3 = new Date();
    var tempSheet = tempSS.getActiveSheet().setName(sheetName);
    tempSheet.getRange(1, 1, values.length, values[0].length).setValues(values);
    SpreadsheetApp.flush();
    Logger.log('[步驟3] setValues + flush 完成 — ' + elapsed_(t3) + '秒');

    // ---- 步驟 4：匯出 xlsx ----
    var t4 = new Date();
    var excelUrl = 'https://docs.google.com/spreadsheets/d/' + tempSS.getId() +
                   '/export?exportFormat=xlsx';
    blob = UrlFetchApp.fetch(excelUrl, {
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }
    }).getBlob().setName(fileName + '.xlsx');
    Logger.log('[步驟4] xlsx 匯出完成 — ' + elapsed_(t4) + '秒，檔案大小=' +
               Math.round(blob.getBytes().length / 1024) + 'KB');

  } finally {
    // ---- 清除暫存 ----
    var t5 = new Date();
    DriveApp.getFileById(tempSS.getId()).setTrashed(true);
    Logger.log('[清除] 暫存試算表已刪除 — ' + elapsed_(t5) + '秒');
  }

  // ---- 步驟 5：輸出結果 ----
  var t6 = new Date();
  try {
    var base64Data = Utilities.base64Encode(blob.getBytes());
    Logger.log('[步驟5] base64 編碼完成 — ' + elapsed_(t6) + '秒，長度=' +
               Math.round(base64Data.length / 1024) + 'KB');

    var html = HtmlService.createHtmlOutput(
      '<script>' +
      'window.onload = function() {' +
      '  var a = document.createElement("a");' +
      '  a.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' +
      base64Data +
      '";' +
      '  a.download = "' + fileName + '.xlsx";' +
      '  document.body.appendChild(a);' +
      '  a.click();' +
      '};' +
      '</script>' +
      '<p style="font-family:sans-serif;font-size:14px;">' +
      '正在下載 <b>' + fileName + '.xlsx</b>⋯</p>' +
      '<p style="font-family:sans-serif;font-size:12px;color:#888;">' +
      '下載完成後可關閉此視窗。</p>'
    ).setWidth(380).setHeight(100);
    SpreadsheetApp.getUi().showModalDialog(html, '匯出下載 — ' + sheetName);
    Logger.log('[步驟5] 對話框已顯示');
  } catch (e) {
    Logger.log('[步驟5] 無 UI 上下文，改存至 Drive — ' + e.message);
    var file    = DriveApp.getFolderById(EXPORT_FOLDER_ID).createFile(blob);
    var fileUrl = file.getUrl();
    Logger.log('[步驟5] 已存至 Drive：' + fileUrl);
  }

  Logger.log('[完成] 總耗時 ' + elapsed_(startTime) + '秒');
}

// ===== 工具函式 =====

function getExportDate_() {
  var now = new Date();
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return String(now.getFullYear()) + pad(now.getMonth() + 1) + pad(now.getDate());
}

function elapsed_(since) {
  return ((new Date().getTime() - since.getTime()) / 1000).toFixed(1);
}
