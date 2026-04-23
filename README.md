# GoogleBattleReport

將 T100 ERP 系統資料定期同步至 Google Sheets 的 Node.js 腳本集。

## 功能

| 腳本 | 資料類型 | 環境 | 日期模式 |
|---|---|---|---|
| `GoogleBattelReportAutoDate.js` | 業績明細 | 正式 | 自動計算（近 2 年）|
| `GoogleBattelReportAutoDateTest.js` | 業績明細 | 測試 | 自動計算（近 2 年）|
| `GoogleBattelReportFreeDate.js` | 業績明細 | 正式 | 手動指定 |
| `GoogleBattelReportFreeDateTest.js` | 業績明細 | 測試 | 手動指定 |
| `GoogleCustomerDe.js` | 客戶明細 | 正式 | — |
| `customerListTest.js` | 客戶明細 | 測試 | — |

## 環境需求

- Node.js 16+
- 具有 Google Sheets 寫入權限的 Service Account 金鑰

## 安裝

```bash
npm install axios googleapis
```

將 Google Service Account 金鑰檔案放至專案根目錄，命名為：

```
t100erpinport-a72dfbb03006.json
```

## 執行

```bash
# 業績明細（正式，日期自動計算）
node GoogleBattelReportAutoDate.js

# 客戶明細（正式）
node GoogleCustomerDe.js
```

## 設定說明

各腳本頂部的設定區可調整：

```js
const ENV            = 'topprd';          // 'topprd'（正式）或 'toptst'（測試）
const SPREADSHEET_ID = '1JrR6...';        // 目標 Google Sheets ID
const SHEET_NAME     = '業績明細';         // 目標工作表名稱
```

FreeDate 版本另需手動調整：

```js
datakey: {
    startdate: '2024-01-01',
    enddate:   '2026-04-01'
}
```

## 注意事項

- Service Account 金鑰（`*.json`）已加入 `.gitignore`，**請勿提交至版本控制**
- 每次執行為**全量覆寫**，執行前會清空目標工作表資料
- 多台主機可同時排程，腳本內建 Google Sheets 分散式鎖定，避免同時寫入衝突
