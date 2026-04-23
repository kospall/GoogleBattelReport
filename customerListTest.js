const axios          = require('axios');
const { google }     = require('googleapis');

// ===== 設定區 =====
const KEYFILE        = './t100erpinport-a72dfbb03006.json';
const SCOPES         = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs';
const SHEET_NAME     = '客戶明細測試';
const RANGE_START    = 'A2';

// ===== 環境切換 =====
const ENV     = 'toptst';  // 'topprd' 或 'toptst'
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

// ===== 呼叫 API =====
async function fetchData() {
    try {
        console.log('📡 呼叫客戶明細 API...');
        const res = await axios.post(API_URL, PAYLOAD, {
            headers: { 'Content-Type': 'application/json' }
        });

        const execution = res.data?.payload?.std_data?.execution;
        const master    = res.data?.payload?.std_data?.parameter?.master || [];

        if (execution?.code !== '0') {
            console.warn(`⚠️  API 回傳錯誤: ${execution?.description}`);
            return [];
        }

        console.log(`✅ 取得 ${master.length} 筆`);
        return master;

    } catch (err) {
        console.warn(`⚠️  呼叫失敗: ${err.message}`);
        return [];
    }
}

// ===== 資料轉換成二維陣列 =====
function toRows(master) {
    return master.map(row => [
        row.l_pmaa001  ?? '',   // 交易對象編號
        row.l_pmaal003 ?? '',   // 名稱
        row.l_pmaal004 ?? '',   // 簡稱
        row.l_pmaa002  ?? '',   // 交易對象類型
        row.l_pmaa003  ?? '',   // 統一編號
        row.l_pmaa005  ?? '',   // 所屬法人
        row.l_pmaa090  ?? '',   // 客戶分類
        row.l_pmaa091  ?? '',   // 客戶價格群組
        row.l_pmaa291  ?? '',   // 客戶其他屬性一
        row.l_pmaa292  ?? '',   // 客戶其他屬性二
        row.l_pmaa293  ?? '',   // 客戶其他屬性三
        row.l_pmaa294  ?? '',   // 客戶其他屬性四
        row.l_pmaa295  ?? '',   // 客戶其他屬性五
        row.l_pmaa296  ?? '',   // 客戶其他屬性六
        row.l_pmaa297  ?? '',   // 客戶其他屬性七
        row.l_pmaa298  ?? '',   // 客戶其他屬性八
        row.l_pmaa299  ?? '',   // 客戶其他屬性九
        row.l_pmaa300  ?? ''    // 客戶其他屬性十
    ]);
}

// ===== 寫入 Google Sheet =====
async function writeToSheet(rows) {
    const sheets = await getSheetClient();

    console.log('🗑️  清空舊資料...');
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range:         `${SHEET_NAME}!A2:Z`
    });

    console.log(`📝 寫入 ${rows.length} 筆至 [${SHEET_NAME}] ${RANGE_START}...`);
    await sheets.spreadsheets.values.update({
        spreadsheetId:    SPREADSHEET_ID,
        range:            `${SHEET_NAME}!${RANGE_START}`,
        valueInputOption: 'RAW',
        requestBody:      { values: rows }
    });

    console.log('✅ 寫入完成！');
}

// ===== 主程式 =====
async function main() {
    try {
        const master = await fetchData();

        if (master.length === 0) {
            console.log('⚠️  查無資料，不執行寫入。');
            return;
        }

        const rows = toRows(master);
        await writeToSheet(rows);

    } catch (err) {
        console.error('❌ 錯誤：', err.message);
        process.exit(1);
    }
}

main();
