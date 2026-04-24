const { google } = require('googleapis');

const KEYFILE        = './t100erpinport-a72dfbb03006.json';
const SCOPES         = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs';
const SHEET_NAME     = '06戰報日期區間';
const LOCK_SHEET     = '資料寫入紀錄與判定';
const TARGET_CELL    = `${SHEET_NAME}!L1`;

async function main() {
    const auth   = new google.auth.GoogleAuth({ keyFile: KEYFILE, scopes: SCOPES });
    const sheets = google.sheets({ version: 'v4', auth });

    // ---- 卡控：F1、H1 不為空白則中止 ----
    const lockRes = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: SPREADSHEET_ID,
        ranges: [`${LOCK_SHEET}!F1`, `${LOCK_SHEET}!H1`]
    });
    const f1 = lockRes.data.valueRanges[0].values?.[0]?.[0]?.toString().trim() ?? '';
    const h1 = lockRes.data.valueRanges[1].values?.[0]?.[0]?.toString().trim() ?? '';

    if (f1 !== '') {
        console.log(`[中止] 業績明細更新中（F1="${f1}"），請稍後再試。`);
        process.exit(0);
    }
    if (h1 !== '') {
        console.log(`[中止] 客戶資料更新中（H1="${h1}"），請稍後再試。`);
        process.exit(0);
    }

    // ---- 讀取目前 L1 值 ----
    const before       = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: TARGET_CELL });
    const currentValue = before.data.values?.[0]?.[0] ?? '(空白)';
    console.log(`目前 L1 值：${currentValue}`);

    // ---- 寫入 ON ----
    await sheets.spreadsheets.values.update({
        spreadsheetId:    SPREADSHEET_ID,
        range:            TARGET_CELL,
        valueInputOption: 'RAW',
        requestBody:      { values: [['ON']] }
    });

    console.log('L1 已設定為 ON');
}

main().catch(err => {
    console.error('執行失敗:', err.message);
    process.exit(1);
});
