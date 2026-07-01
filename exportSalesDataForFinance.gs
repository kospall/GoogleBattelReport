// ===== 業績明細匯出給財務 =====
// 從『業績明細』依指定日期區間（單據日期）篩選資料，
// 左側加入 單別 / 分公司代號 / 中文 三欄，匯出為無公式 xlsx。
//
// 單別：依『單據單號』前 6 碼判定
//   01-E01 → 寄庫訂單
//   01-E02 → 出貨單
//   其他   → 銷退單
//
// 分公司代號：取自『戰報分區』欄位（P欄）原值
// 中文      ：依分公司代號對照 SALES_AREA_MAP_ 轉換為戰報分區中文名稱
//
// 排除規則：『銷售通路』或『分公司代號（戰報分區）』為空白者，不納入匯出

var SALES_AREA_MAP_ = {
  '10': '台北', '10A': '台北', '10B': '台北', '10C': '台北', '10D': '台北',
  '10E': '台北', '10F': '台北', '10G': '宜蘭', '19': '台北',
  '20': '桃園', '20A': '桃園', '20B': '桃園', '20C': '桃園', '29': '桃園',
  '30': '竹苗', '33': '竹苗', '30A': '竹苗', '30B': '竹苗', '30C': '竹苗', '39': '竹苗',
  '40': '台中', '40A': '台中', '40B': '台中', '40C': '台中', '40D': '台中', '49': '台中',
  '50': '彰投', '55': '彰投', '50A': '彰投', '50C': '彰投', '50E': '花蓮', '59': '彰投',
  '60': '雲嘉', '66': '雲嘉', '60A': '雲嘉', '60B': '雲嘉', '60C': '雲嘉', '60D': '雲嘉', '69': '雲嘉',
  '70': '台南', '77': '台南', '70A': '台南', '70B': '台南', '70C': '台南', '70D': '澎湖', '79': '台南',
  '80': '高雄', '88': '高雄', '80A': '高雄', '80B': '高雄', '80C': '高雄', '80D': '高雄', '80E': '台東', '89': '高雄'
};

var FINANCE_EXPORT_HEADER_ = [
  '單別', '分公司代號', '中文',
  '單據單號', '訂單客戶', '銷售通路', '項次', '料件編號',
  '計價數量', '未稅金額', '含稅金額', '稅額', '訂單單號', '單據日期', '銷售分群', '補空格'
];

// 業績明細欄位索引（0-based）；AREA（戰報分區）位於 P 欄
var SRC_COL_ = {
  DOCNO: 0, CUSTOMER: 1, CHANNEL: 2, SEQ: 3, ITEM: 4,
  QTY: 5, AMT_NOTAX: 6, AMT_TAX: 7, TAX: 8, ORDERNO: 9,
  DOCDATE: 10, SALESGROUP: 11, PADDING: 13, AREA: 15
};

function exportSalesDataForFinance() {
  var ui = SpreadsheetApp.getUi();

  var startResp = ui.prompt('匯出業績明細給財務', '請輸入開始日期（格式 YYYY-MM-DD 或 YYYY/MM/DD）：', ui.ButtonSet.OK_CANCEL);
  if (startResp.getSelectedButton() !== ui.Button.OK) return;
  var startDate = parseDateInput_(startResp.getResponseText().trim());
  if (!startDate) {
    ui.alert('開始日期格式錯誤，請重新執行。');
    return;
  }

  var endResp = ui.prompt('匯出業績明細給財務', '請輸入結束日期（格式 YYYY-MM-DD 或 YYYY/MM/DD）：', ui.ButtonSet.OK_CANCEL);
  if (endResp.getSelectedButton() !== ui.Button.OK) return;
  var endDate = parseDateInput_(endResp.getResponseText().trim());
  if (!endDate) {
    ui.alert('結束日期格式錯誤，請重新執行。');
    return;
  }

  if (startDate > endDate) {
    ui.alert('開始日期不能晚於結束日期。');
    return;
  }

  exportSalesDataForFinance_(startDate, endDate);
}

function exportSalesDataForFinance_(startDate, endDate) {
  var startTime = new Date();
  Logger.log('[開始] 匯出業績明細給財務 — ' + startTime.toLocaleTimeString());

  var spreadsheetId = '1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs';
  var ss    = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName('業績明細');

  if (!sheet) {
    Logger.log('[錯誤] 找不到工作表：業績明細');
    return;
  }

  var dataRange = sheet.getDataRange();
  var rowCount  = dataRange.getNumRows();
  if (rowCount < 2) {
    Logger.log('[錯誤] 業績明細 工作表無資料。');
    return;
  }

  // 第 1 列為表頭，資料自第 2 列開始
  var values = dataRange.getDisplayValues();
  var dataRows = values.slice(1);

  var outputRows = [FINANCE_EXPORT_HEADER_];
  var matchedCount = 0;

  for (var i = 0; i < dataRows.length; i++) {
    var row = dataRows[i];
    var docDateStr = row[SRC_COL_.DOCDATE];
    var docDate = parseDateInput_(docDateStr);
    if (!docDate || docDate < startDate || docDate > endDate) continue;

    var docNo   = row[SRC_COL_.DOCNO] || '';
    var channel = String(row[SRC_COL_.CHANNEL] || '').trim();
    var area    = String(row[SRC_COL_.AREA] || '').trim();

    // 排除銷售通路或分公司代號（戰報分區）為空白的資料
    if (!channel || !area) continue;

    outputRows.push([
      resolveDocType_(docNo),
      area,
      SALES_AREA_MAP_[area] || '',
      docNo,
      row[SRC_COL_.CUSTOMER]   || '',
      channel,
      row[SRC_COL_.SEQ]        || '',
      row[SRC_COL_.ITEM]       || '',
      row[SRC_COL_.QTY]        || '',
      row[SRC_COL_.AMT_NOTAX]  || '',
      row[SRC_COL_.AMT_TAX]    || '',
      row[SRC_COL_.TAX]        || '',
      row[SRC_COL_.ORDERNO]    || '',
      docDateStr,
      row[SRC_COL_.SALESGROUP] || '',
      row[SRC_COL_.PADDING]    || ''
    ]);
    matchedCount++;
  }

  Logger.log('[資訊] 符合日期區間資料筆數：' + matchedCount);

  if (matchedCount === 0) {
    SpreadsheetApp.getUi().alert('指定日期區間內無符合資料。');
    return;
  }

  var fileName = getExportDate_() + ' 業績明細_財務用_' +
                 formatDateCompact2_(startDate) + '-' + formatDateCompact2_(endDate);

  // ---- 建立暫存試算表並匯出 xlsx ----
  var tempSS = SpreadsheetApp.create('Temp_業績明細_財務用');
  var blob;

  try {
    var tempSheet = tempSS.getActiveSheet().setName('業績明細');
    tempSheet.getRange(1, 1, outputRows.length, outputRows[0].length).setValues(outputRows);
    SpreadsheetApp.flush();

    var excelUrl = 'https://docs.google.com/spreadsheets/d/' + tempSS.getId() +
                   '/export?exportFormat=xlsx';
    blob = UrlFetchApp.fetch(excelUrl, {
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }
    }).getBlob().setName(fileName + '.xlsx');
  } finally {
    DriveApp.getFileById(tempSS.getId()).setTrashed(true);
  }

  try {
    var base64Data = Utilities.base64Encode(blob.getBytes());
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
    SpreadsheetApp.getUi().showModalDialog(html, '匯出下載 — 業績明細（財務用）');
  } catch (e) {
    Logger.log('[錯誤] 無 UI 上下文，改存至 Drive — ' + e.message);
    var file    = DriveApp.getFolderById(EXPORT_FOLDER_ID).createFile(blob);
    Logger.log('[完成] 已存至 Drive：' + file.getUrl());
  }

  Logger.log('[完成] 總耗時 ' + elapsed_(startTime) + '秒');
}

// ===== 工具函式 =====

// 依單據單號前 6 碼判定單別
function resolveDocType_(docNo) {
  var prefix = String(docNo).substring(0, 6);
  if (prefix === '01-E01') return '寄庫訂單';
  if (prefix === '01-E02') return '出貨單';
  return '銷退單';
}

// 解析 YYYY-MM-DD 或 YYYY/MM/DD 字串為 Date（僅比較年月日，時間歸零）
function parseDateInput_(str) {
  if (!str) return null;
  var m = String(str).trim().match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (!m) return null;
  var y = parseInt(m[1], 10);
  var mo = parseInt(m[2], 10) - 1;
  var d = parseInt(m[3], 10);
  var date = new Date(y, mo, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

function formatDateCompact2_(date) {
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return String(date.getFullYear()) + pad(date.getMonth() + 1) + pad(date.getDate());
}
