/**
 * 使用方式：
 *   node registerWindowsTask.js <時間> [任務名稱]
 *
 * 範例：
 *   node registerWindowsTask.js 08:00
 *   node registerWindowsTask.js 06:30 GoogleBattleReport_Morning
 *
 * 說明：
 *   - 預設每日執行，時間為第一個參數（必填）
 *   - 會先產生 runBattleReport.bat 作為排程入口，再向 Windows 工作排程器登錄
 *   - 需以「系統管理員」身分執行此腳本
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const time     = process.argv[2];
const taskName = process.argv[3] || 'GoogleBattleReport';

if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    console.error('請輸入正確的時間參數，格式為 HH:MM');
    console.error('範例：node registerWindowsTask.js 08:00');
    process.exit(1);
}

const nodePath   = process.execPath;                                         // node.exe 完整路徑
const scriptPath = path.join(__dirname, 'runBattleReportSequence.js');
const batPath    = path.join(__dirname, 'runBattleReport.bat');

// ---- 產生 .bat 中介檔（避免 schtasks 引號問題）----
const batContent = [
    '@echo off',
    `cd /d "${__dirname}"`,
    `"${nodePath}" "${scriptPath}"`,
    'exit /b %errorlevel%'
].join('\r\n');

fs.writeFileSync(batPath, batContent, 'utf8');
console.log(`已產生：${batPath}`);

// ---- 向 Windows 工作排程器登錄 ----
const cmd = `schtasks /create /tn "${taskName}" /tr "${batPath}" /sc daily /st ${time} /f`;

try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`\n工作排程已建立：`);
    console.log(`  任務名稱：${taskName}`);
    console.log(`  執行時間：每日 ${time}`);
    console.log(`  執行順序：業績明細 → 客戶明細 → 寫入ON`);
    console.log(`\n查看排程：schtasks /query /tn "${taskName}" /fo LIST`);
    console.log(`刪除排程：schtasks /delete /tn "${taskName}" /f`);
} catch (e) {
    console.error('工作排程建立失敗，請確認是否以系統管理員身分執行');
    process.exit(1);
}
