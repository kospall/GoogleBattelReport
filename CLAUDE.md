# GoogleBattleReport

將 T100 ERP 系統資料同步至 Google Sheets，並以 Google Apps Script 定時寄出業績戰報的腳本集。

> 完整技術文件請見 [README.md](README.md)。

## 專案結構

```
GoogleBattleReport/
├── deploy/                           # 新主機佈置用的正式腳本套件
│   ├── GoogleBattelReportAutoDate.js
│   ├── GoogleBattelReportFreeDate.js
│   ├── GoogleCustomerDe.js
│   ├── setReportSwitchON.js
│   ├── runBattleReportSequence.js
│   ├── runFreeDateInput.js
│   ├── runFreeDateReport.bat
│   ├── registerWindowsTask.js
│   ├── sent06BattleReport.gs
│   └── README.md                     # 佈置步驟說明
├── GoogleBattelReportAutoDate.js     # 業績明細 — 正式環境，日期自動計算
├── GoogleBattelReportAutoDateTest.js # 業績明細 — 測試環境，日期自動計算
├── GoogleBattelReportFreeDate.js     # 業績明細 — 手動日期（接受 CLI 參數）
├── GoogleBattelReportFreeDateTest.js # 業績明細 — 測試環境，日期手動設定
├── GoogleCustomerDe.js               # 客戶明細 — 正式環境
├── customerListTest.js               # 客戶明細 — 測試環境
├── runBattleReportSequence.js        # 依序執行器（業績明細→客戶明細→寫入ON）
├── runFreeDateInput.js               # 手動上傳互動介面（輸入日期並呼叫 FreeDate）
├── runFreeDateReport.bat             # 手動上傳啟動捷徑（雙擊執行）
├── setReportSwitchON.js              # 將 L1 寄信開關設為 ON
├── registerWindowsTask.js            # Windows 工作排程器登錄工具
├── sent04BattleReport.gs             # Google Apps Script — 04戰報寄送（全國）
├── sent06BattleReport.gs             # Google Apps Script — 06戰報寄送
├── setMonthEndHold.gs                # Google Apps Script — 月初自動卡控 L3
├── ui.gs                             # Google Apps Script — Sheets 自訂選單（onOpen）
├── cwsspa016.4gl                     # 後端 API 原始碼 — 取得戰報明細（Genero BDL）
├── cwsspa017.4gl                     # 後端 API 原始碼 — 取得客戶明細（Genero BDL）
└── t100erpinport-a72dfbb03006.json   # Google Service Account 金鑰（勿提交，已 gitignore）
```

## 關鍵常數

| 項目 | 值 |
|---|---|
| Spreadsheet ID | `1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs` |
| 正式 API（`topprd`）| `http://192.168.70.107/wstopprd/ws/r/awsp920` |
| 測試 API（`toptst`）| `http://192.168.70.107/wtoptst/ws/r/awsp920` |
| 業績明細 API | `cwsspa016` / `get.xmd.outboundlist` |
| 客戶明細 API | `cwsspa017` / `get.pmaa.customerlist` |
| 業績明細鎖定格 | `資料寫入紀錄與判定!F1` |
| 客戶明細鎖定格 | `資料寫入紀錄與判定!H1` |

## 重要機制摘要

**分散式鎖**：多台主機競爭時以 Sheets 儲存格做互斥鎖，寫入前讀鎖、等 1.5 秒再確認、完成後釋放。詳見 [README.md#分散式鎖定機制](README.md#分散式鎖定機制)。

**日期計算**：AutoDate 版本以「3 年前的 10/1」為起點，向前調整直到區間 ≤ 2 年。必須用 `toLocalDateStr()` 而非 `toISOString()`（UTC 偏移會把 10/1 變 9/30）。詳見 [README.md#日期計算autodate-版本](README.md#日期計算autodate-版本)。

**月初卡控**：每月 1 日 07:00 自動將 L3 設為 `月初確認`，阻擋寄信直到人工確認 C2 日期並從選單解除。詳見 [README.md#setmonthendholdgs](README.md#setmonthendholdgs)。

**dateSwitch**：業績明細 API 有 5 個 SQL 切換（1=出庫、2=有來源退庫、3=無來源退庫、4=訂單非S05、5=訂單S05），JS 腳本呼叫 1~5，後端另有 6 未使用。詳見 [README.md#dateswitch-說明](README.md#dateswitch-說明)。
