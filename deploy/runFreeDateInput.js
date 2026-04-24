const readline   = require('readline');
const { spawnSync } = require('child_process');
const path       = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function main() {
    console.log('');
    console.log('  ====================================================');
    console.log('    業績明細手動上傳 | GoogleBattelReportFreeDate');
    console.log('  ====================================================');
    console.log('');

    let startdate;
    while (true) {
        startdate = (await ask('  起始日期 (YYYY-MM-DD，例: 2024-01-01): ')).trim();
        if (DATE_RE.test(startdate)) break;
        console.log('  [錯誤] 格式不正確，請輸入 YYYY-MM-DD\n');
    }

    let enddate;
    while (true) {
        enddate = (await ask('  結束日期 (YYYY-MM-DD，例: 2026-04-24): ')).trim();
        if (DATE_RE.test(enddate)) break;
        console.log('  [錯誤] 格式不正確，請輸入 YYYY-MM-DD\n');
    }

    console.log('');
    console.log('  ----------------------------------------');
    console.log('  起始日期：' + startdate);
    console.log('  結束日期：' + enddate);
    console.log('  ----------------------------------------');
    console.log('');

    const confirm = (await ask('  確認執行？(Y/N): ')).trim().toUpperCase();
    rl.close();

    if (confirm !== 'Y') {
        console.log('\n  已取消。');
        return;
    }

    console.log('\n  開始執行...\n');

    const result = spawnSync(
        process.execPath,
        [path.join(__dirname, 'GoogleBattelReportFreeDate.js'), startdate, enddate],
        { cwd: __dirname, stdio: 'inherit' }
    );

    console.log('');
    if (result.status === 0) {
        console.log('  [完成] 執行成功');
    } else {
        console.log('  [錯誤] 執行失敗，請查看 業績明細上傳紀錄.log');
    }
}

main().catch(err => {
    rl.close();
    console.error('[ERROR]', err.message);
    process.exit(1);
});
