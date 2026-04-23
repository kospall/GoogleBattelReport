const axios          = require('axios');
const fs             = require('fs');
const path           = require('path');
const os             = require('os');
const { google }     = require('googleapis');

// ===== Log 設定 =====
const LOG_FILE = path.join(__dirname, '業績明細上傳紀錄.log');

function writeLog(msg) {
    const timestamp = new Date().toLocaleString('zh-TW', { hour12: false });
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line, 'utf8');
    console.log(msg);
}

// ===== 設定區 =====
const KEYFILE        = './t100erpinport-a72dfbb03006.json';
const SCOPES         = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs';
const SHEET_NAME     = '業績明細';
const RANGE_START    = 'A2';
const LOCK_SHEET     = '資料寫入紀錄與判定';
const LOCK_CELL      = `${LOCK_SHEET}!F1`;

// ===== 環境切換 =====
const ENV     = 'toptst';
const API_URL = ENV === 'topprd'
    ? 'http://192.168.70.107/wstopprd/ws/r/awsp920'
    : 'http://192.168.70.107/wtoptst/ws/r/awsp920';


// ===== API 基本參數 =====

const BASE_PAYLOAD = {
    key:  'f5458f5c0f9022db743a7c0710145903',
    type: 'sync',
    host: {
        prod:      'importgoogleapi',
        ip:        '192.168.70.107',
        lang:      'zh_TW',
        acct:      'tiptop',
        timestamp: new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 17)
    },
    service: {
        prod: 'T100',
        name: 'get.xmd.outboundlist',
        ip:   '192.168.70.107',
        id:   ENV
    },
    datakey: {
        EntId:     '1',
        CompanyId: 'BD01',
        startdate: '2024-01-01',
        enddate: '2026-04-01'
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

// ===== 嘗試取得鎖定（寫入 F1）=====
async function acquireLock(sheets) {
    // 先讀取 F1 是否已有值
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range:         LOCK_CELL
    });
    const current = res.data.values?.[0]?.[0] ?? '';

    if (current !== '') {
        writeLog(`[LOCK] F1 已有值：「${current}」，另一台主機正在寫入，本次中止。`);
        return false;
    }

    // 寫入鎖定值
    const lockValue = getLockValue();
    await sheets.spreadsheets.values.update({
        spreadsheetId:    SPREADSHEET_ID,
        range:            LOCK_CELL,
        valueInputOption: 'RAW',
        requestBody:      { values: [[lockValue]] }
    });

    // 稍待後再讀一次，確認是自己寫入的（降低極端競爭情況）
    await new Promise(r => setTimeout(r, 1500));
    const verify = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range:         LOCK_CELL
    });
    const confirmed = verify.data.values?.[0]?.[0] ?? '';
    if (confirmed !== lockValue) {
        writeLog(`[LOCK] 鎖定被其他主機搶先取得（F1="${confirmed}"），本次中止。`);
        return false;
    }

    writeLog(`[LOCK] 已取得鎖定：${lockValue}`);
    return true;
}

// ===== 釋放鎖定（清空 F1）=====
async function releaseLock(sheets) {
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range:         LOCK_CELL
    });
    writeLog('[LOCK] 已釋放鎖定（F1 已清空）');
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
    writeLog(`[RECORD] 已寫入紀錄：${now}  ${hostname}  ${status}`);
}

// ===== 資料轉換成二維陣列 =====
function toRows(master) {
    return master.map(row => [
        row.l_xmdkdocno ?? '',
        row.l_xmdk007   ?? '',
        row.l_xmda023   ?? '',
        row.l_xmdlseq   ?? '',
        row.l_xmdc001   ?? '',
        row.l_xmdl022   ?? '',
        row.l_xmdl027   ?? '',
        row.l_xmdl028   ?? '',
        row.l_xmdl029   ?? '',
        row.l_xmdl003   ?? '',
        row.l_xmdkdocdt ?? '',
        row.l_imaf111   ?? '',
        row.l_xmdl888   ?? '',
        row.l_xmdl999   ?? ''
    ]);
}

// ===== 追加寫入 Google Sheet =====
async function appendToSheet(sheets, rows, startRow) {
    const range = `${SHEET_NAME}!A${startRow}`;
    writeLog(`寫入 ${rows.length} 筆至 [${SHEET_NAME}] A${startRow}`);
    await sheets.spreadsheets.values.update({
        spreadsheetId:    SPREADSHEET_ID,
        range,
        valueInputOption: 'RAW',
        requestBody:      { values: rows }
    });
}

// ===== 呼叫單一 dateSwitch 的所有分頁，邊撈邊寫 =====
async function fetchAndWriteBySwitch(sheets, dateSwitch, currentRow) {
    let pageNo = 1;
    let totalPages = 1;
    let switchTotal = 0;

    while (pageNo <= totalPages) {
        const payload = {
            ...BASE_PAYLOAD,
            datakey: {
                ...BASE_PAYLOAD.datakey,
                dateSwitch,
                pageNo
            }
        };

        try {
            writeLog(`呼叫 dateSwitch=${dateSwitch} pageNo=${pageNo}...`);
            const res = await axios.post(API_URL, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            const execution  = res.data?.payload?.std_data?.execution;
            const parameter  = res.data?.payload?.std_data?.parameter;
            const master     = parameter?.master || [];

            if (execution?.code !== '0') {
                writeLog(`[WARN] dateSwitch=${dateSwitch} pageNo=${pageNo} 回傳錯誤: ${execution?.description}`);
                break;
            }

            if (pageNo === 1 && parameter?.totalPages) {
                totalPages = parameter.totalPages;
                writeLog(`dateSwitch=${dateSwitch} 共 ${parameter.totalCount} 筆, ${totalPages} 頁`);
            }

            if (master.length === 0) {
                writeLog(`[WARN] dateSwitch=${dateSwitch} pageNo=${pageNo} 無資料`);
                break;
            }

            const rows = toRows(master);
            await appendToSheet(sheets, rows, currentRow);

            switchTotal += master.length;
            currentRow  += master.length;
            pageNo++;

        } catch (err) {
            writeLog(`[ERROR] dateSwitch=${dateSwitch} pageNo=${pageNo} 呼叫失敗: ${err.message}`);
            break;
        }
    }

    writeLog(`dateSwitch=${dateSwitch} 合計寫入 ${switchTotal} 筆`);
    return currentRow;
}

// ===== 主程式 =====
async function main() {
    try {
        writeLog('========== 開始執行 ==========');

        const sheets = await getSheetClient();

        // ----- 取得鎖定 -----
        const locked = await acquireLock(sheets);
        if (!locked) {
            writeLog('========== 執行中止 ==========\n');
            return;
        }
		let writeSuccess = false;

        try {
            const switches = ['1', '2', '3', '4', '5'];

            writeLog('清空舊資料...');
            await sheets.spreadsheets.values.clear({
                spreadsheetId: SPREADSHEET_ID,
                range:         `${SHEET_NAME}!A2:N`
            });

            let currentRow   = 2;
            let totalWritten = 0;

            for (const sw of switches) {
                const newRow = await fetchAndWriteBySwitch(sheets, sw, currentRow);
                totalWritten += (newRow - currentRow);
                currentRow = newRow;
            }

            if (totalWritten === 0) {
                writeLog('[WARN] 全部 dateSwitch 均查無資料。');
            } else {
                writeLog(`全部完成！共寫入 ${totalWritten} 筆`);
            }
			
			writeSuccess = true;

        } finally {
            // 無論成功或失敗都寫入紀錄並釋放鎖定
            await appendWriteRecord(sheets, writeSuccess ? '業績明細' : '寫入失敗');
            await releaseLock(sheets);
        }

        writeLog('========== 執行結束 ==========\n');

    } catch (err) {
        writeLog(`[ERROR] ${err.message}`);
        process.exit(1);
    }
}

main();
