# GoogleBattleReport

將 T100 ERP 系統資料定期同步至 Google Sheets，並自動寄出業績戰報的腳本集。

## 腳本一覽

### Node.js — 資料同步

| 腳本 | 說明 | 環境 |
|---|---|---|
| `GoogleBattelReportAutoDate.js` | 業績明細同步，日期自動計算（近 2 年）| 正式 |
| `GoogleBattelReportAutoDateTest.js` | 業績明細同步，日期自動計算 | 測試 |
| `GoogleBattelReportFreeDate.js` | 業績明細同步，日期手動指定 | 正式 |
| `GoogleBattelReportFreeDateTest.js` | 業績明細同步，日期手動指定 | 測試 |
| `GoogleCustomerDe.js` | 客戶明細同步 | 正式 |
| `customerListTest.js` | 客戶明細同步 | 測試 |

### Node.js — 排程控制

| 腳本 | 說明 |
|---|---|
| `runBattleReportSequence.js` | 依序執行：業績明細 → 客戶明細 → 寫入ON，任一失敗即中止 |
| `setReportSwitchON.js` | 將 Google Sheets 的寄信開關（L1）設為 ON |
| `registerWindowsTask.js` | 向 Windows 工作排程器登錄每日排程 |

### Google Apps Script

| 腳本 | 說明 |
|---|---|
| `sent06BattleReport.gs` | 從 Google Sheets 匯出 PDF + Excel，透過 Gmail 寄出戰報 |

## 快速開始（新主機佈置）

請參閱 **[deploy/README.md](deploy/README.md)** 取得完整佈置步驟。

簡要流程：

```cmd
# 1. 安裝相依套件
npm install axios googleapis

# 2. 放置金鑰（t100erpinport-a72dfbb03006.json）至工作目錄

# 3. 測試執行
node runBattleReportSequence.js

# 4. 登錄每日排程（系統管理員身分）
node registerWindowsTask.js 08:00
```

## 環境需求

- Node.js 16+
- Google Service Account 金鑰（具 Sheets 寫入權限）

## 設定說明

各腳本頂部的設定區可調整：

```js
const ENV            = 'topprd';   // 'topprd'（正式）或 'toptst'（測試）
const SPREADSHEET_ID = '1JrR6...'; // 目標 Google Sheets ID
const SHEET_NAME     = '業績明細'; // 目標工作表名稱
```

## 注意事項

- Service Account 金鑰（`*.json`）已加入 `.gitignore`，**請勿提交至版本控制**
- 每次執行為**全量覆寫**，執行前會清空目標工作表資料
- 多台主機可同時排程，腳本內建 Google Sheets 分散式鎖定，避免同時寫入衝突
- Apps Script 寄送成功後會自動將 L1 改回 `OFF`，需再次執行 `setReportSwitchON.js` 才能重新啟用
