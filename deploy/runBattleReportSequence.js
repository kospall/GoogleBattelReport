const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '排程執行紀錄.log');

function log(msg) {
    const timestamp = new Date().toLocaleString('zh-TW', { hour12: false });
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line, 'utf8');
    console.log(msg);
}

const STEPS = [
    { name: '業績明細', script: 'GoogleBattelReportAutoDate.js' },
    { name: '客戶明細', script: 'GoogleCustomerDe.js'           },
    { name: '寫入ON',   script: 'setReportSwitchON.js'          }
];

log('========== 排程開始執行 ==========');

for (const step of STEPS) {
    log(`---- 開始：${step.name} ----`);

    const result = spawnSync(process.execPath, [path.join(__dirname, step.script)], {
        cwd:   __dirname,
        stdio: 'inherit'
    });

    if (result.error) {
        log(`[ERROR] ${step.name} 無法啟動：${result.error.message}`);
        log('========== 排程中止 ==========\n');
        process.exit(1);
    }

    if (result.status !== 0) {
        log(`[FAIL] ${step.name} 執行失敗（exit code: ${result.status}），後續步驟中止`);
        log('========== 排程中止 ==========\n');
        process.exit(1);
    }

    log(`[OK] ${step.name} 完成`);
}

log('========== 排程全部完成 ==========\n');
