const axios          = require('axios');
const { google }     = require('googleapis');
const fs             = require('fs');
const path           = require('path');
const os             = require('os');

// ===== 設定區 =====
const KEYFILE        = './t100erpinport-a72dfbb03006.json';
const SCOPES         = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs';
const SHEET_NAME     = '客戶明細';
const RANGE_START    = 'A2';
const LOCK_SHEET     = '資料寫入紀錄與判定';
const LOCK_CELL      = `${LOCK_SHEET}!H1`;

// ===== Log 設定 =====
const LOG_FILE = path.join(__dirname, '客戶明細上傳紀錄.log');

function log(msg) {
    const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    const line = `[${timestamp}] ${msg}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

// ===== 環境切換 =====
const ENV     = 'toptst';
const API_URL = ENV === 'topprd'
    ? 'http://192.168.70.107/wstopprd/ws/r/awsp920'
    : 'http://192.168.70.107/wtoptst/ws/r/awsp920';

// ===== API 基本參數 =====
const PAYLOAD = {
    key:  'f5458f5c0f9022db743a7c0710145903',
    type: 'sync',
    host: {
        prod:      'OpenAPI',
        ip:        '192.168.70.107',
        lang:      'zh_TW',
        acct:      'tiptop',
        timestamp: new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 17)
    },
    service: {
        prod: 'T100',
        name: 'get.pmaa.customerlist.test',
        ip:   '192.168.70.107',
        id:   ENV
    },
    datakey: {
        EntId: '1'
    }
};

// ===== Google Sheets 授權 =====
async function getSheetClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILE,
        scopes:  SCOPES
    });
    return google.sheets({ version: 'v4', auth });
}

// ===== 取得鎖定值（時間 + 主機名稱）=====
function getLockValue() {
    const now = new Date().toLocaleString('zh-TW', { hour12: false });
    return `${now} ${os.hostname()}`;
}

// ===== 嘗試取得鎖定（寫入 H1）=====
async function acquireLock(sheets) {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range:         LOCK_CELL
    });
    const current = res.data.values?.[0]?.[0] ?? '';

    if (current !== '') {
        log(`[LOCK] H1 已有值：「${current}」，另一台主機正在寫入，本次中止。`);
        return false;
    }

    const lockValue = getLockValue();
    await sheets.spreadsheets.values.update({
        spreadsheetId:    SPREADSHEET_ID,
        range:            LOCK_CELL,
        valueInputOption: 'RAW',
        requestBody:      { values: [[lockValue]] }
    });

    await new Promise(r => setTimeout(r, 1500));
    const verify    = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range:         LOCK_CELL
    });
    const confirmed = verify.data.values?.[0]?.[0] ?? '';
    if (confirmed !== lockValue) {
        log(`[LOCK] 鎖定被其他主機搶先取得（H1="${confirmed}"），本次中止。`);
        return false;
    }

    log(`[LOCK] 已取得鎖定：${lockValue}`);
    return true;
}

// ===== 釋放鎖定（清空 H1）=====
async function releaseLock(sheets) {
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range:         LOCK_CELL
    });
    log('[LOCK] 已釋放鎖定（H1 已清空）');
}

// ===== 追加寫入紀錄至 A/B/C 欄 =====
async function appendWriteRecord(sheets, status) {
    const now      = new Date().toLocaleString('zh-TW', { hour12: false });
    const hostname = os.hostname();
    await sheets.spreadsheets.values.append({
        spreadsheetId:    SPREADSHEET_ID,
        range:            `${LOCK_SHEET}!A:C`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody:      { values: [[now, hostname, status]] }
    });
    log(`[RECORD] 已寫入紀錄：${now}  ${hostname}  ${status}`);
}

// ===== 呼叫 API =====
async function fetchData() {
    try {
        log('呼叫客戶明細 API...');
        const res = await axios.post(API_URL, PAYLOAD, {
            headers: { 'Content-Type': 'application/json' }
        });

        const execution = res.data?.payload?.std_data?.execution;
        const master    = res.data?.payload?.std_data?.parameter?.master || [];

        if (execution?.code !== '0') {
            log(`API 回傳錯誤: ${execution?.description}`);
            return [];
        }

        log(`API 取得 ${master.length} 筆資料`);
        return master;

    } catch (err) {
        log(`API 呼叫失敗: ${err.message}`);
        return [];
    }
}

// ===== 資料轉換成二維陣列 =====
function toRows(master) {
    return master.map(row => [
        row.l_pmaa001  ?? '',
        row.l_pmaal003 ?? '',
        row.l_pmaal004 ?? '',
        row.l_pmaa002  ?? '',
        row.l_pmaa003  ?? '',
        row.l_pmaa005  ?? '',
        row.l_pmaa090  ?? '',
        row.l_pmaa091  ?? '',
        row.l_pmaa291  ?? '',
        row.l_pmaa292  ?? '',
        row.l_pmaa293  ?? '',
        row.l_pmaa294  ?? '',
        row.l_pmaa295  ?? '',
        row.l_pmaa296  ?? '',
        row.l_pmaa297  ?? '',
        row.l_pmaa298  ?? '',
        row.l_pmaa299  ?? '',
        row.l_pmaa300  ?? ''
    ]);
}

// ===== 寫入 Google Sheet =====
async function writeToSheet(sheets, rows) {
    log('清空舊資料...');
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range:         `${SHEET_NAME}!A2:Z`
    });

    log(`寫入 ${rows.length} 筆至 [${SHEET_NAME}] ${RANGE_START}...`);
    await sheets.spreadsheets.values.update({
        spreadsheetId:    SPREADSHEET_ID,
        range:            `${SHEET_NAME}!${RANGE_START}`,
        valueInputOption: 'RAW',
        requestBody:      { values: rows }
    });

    log('Google Sheet 寫入完成');
}

// ===== 主程式 =====
async function main() {
    log('========== 開始執行客戶明細上傳 ==========');
    try {
        const sheets = await getSheetClient();

        // ----- 取得鎖定 -----
        const locked = await acquireLock(sheets);
        if (!locked) {
            log('========== 執行中止 ==========\n');
            return;
        }

        let writeSuccess = false;
        try {
            const master = await fetchData();

            if (master.length === 0) {
                log('查無資料，不執行寫入。');
            } else {
                const rows = toRows(master);
                await writeToSheet(sheets, rows);
                log('========== 執行完成 ==========');
            }

            writeSuccess = true;

        } finally {
            await appendWriteRecord(sheets, writeSuccess ? '客戶明細' : '寫入失敗');
            await releaseLock(sheets);
        }

    } catch (err) {
        log(`錯誤：${err.message}`);
        log('========== 執行異常結束 ==========');
        process.exit(1);
    }
}

main();
