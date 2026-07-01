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
│   ├── GooglePledgeBillAutoDate.js
│   ├── GooglePledgeBillFreeDate.js
│   ├── GoogleOffsetListAutoDate.js
│   ├── GoogleOffsetListFreeDate.js
│   ├── setReportSwitchON.js
│   ├── runBattleReportSequence.js
│   ├── runFreeDateInput.js
│   ├── runFreeDateReport.bat
│   ├── runPledgeOffsetAutoDate.bat
│   ├── registerWindowsTask.js
│   ├── sent06BattleReport.gs
│   ├── sent68SummerReport.gs
│   ├── exportSheetData.gs
│   ├── ui.gs
│   └── README.md                     # 佈置步驟說明
├── GoogleBattelReportAutoDate.js     # 業績明細 — 正式環境，日期自動計算
├── GoogleBattelReportAutoDateTest.js # 業績明細 — 測試環境，日期自動計算
├── GoogleBattelReportFreeDate.js     # 業績明細 — 手動日期（接受 CLI 參數）
├── GoogleBattelReportFreeDateTest.js # 業績明細 — 測試環境，日期手動設定
├── GoogleCustomerDe.js               # 客戶明細 — 正式環境
├── GooglePledgeBillAutoDate.js        # 切結明細 — 正式環境，日期自動計算（含分散式鎖 J1）
├── GooglePledgeBillFreeDate.js        # 切結明細 — 正式環境，手動日期（含分散式鎖 J1）
├── GooglePledgeBillTest.js            # 切結明細 — 測試環境（含分散式鎖 J1）
├── GoogleOffsetListAutoDate.js       # 切結轉神寶 — 正式環境，日期自動計算（含分散式鎖 L1）
├── GoogleOffsetListFreeDate.js       # 切結轉神寶 — 正式環境，手動日期（含分散式鎖 L1）
├── GoogleOffsetListTest.js           # 切結轉神寶 — 測試環境（含分散式鎖 L1）
├── customerListTest.js               # 客戶明細 — 測試環境
├── runBattleReportSequence.js        # 依序執行器（業績明細→客戶明細→寫入ON）
├── runPledgeOffsetAutoDate.bat       # 切結沖銷排程啟動捷徑（雙擊執行，含 log）
├── runFreeDateInput.js               # 手動上傳互動介面（輸入日期並呼叫 FreeDate）
├── runFreeDateReport.bat             # 手動上傳啟動捷徑（雙擊執行）
├── setReportSwitchON.js              # 將 L1 寄信開關設為 ON
├── registerWindowsTask.js            # Windows 工作排程器登錄工具
├── sent04BattleReport.gs             # Google Apps Script — 04戰報寄送（全國）
├── sent06BattleReport.gs             # Google Apps Script — 06戰報寄送
├── sent68SummerReport.gs             # Google Apps Script — 68夏季活動寄送（含 E 欄篩選）
├── sent99AnnualBonus.gs              # Google Apps Script — 99年度獎金寄送（含 D 欄篩選）
├── setMonthEndHold.gs                # Google Apps Script — 月初自動卡控 L3
├── exportSheetData.gs                # Google Apps Script — 匯出業績/客戶明細為無公式 xlsx
├── exportSalesDataForFinance.gs      # Google Apps Script — 匯出業績明細給財務（指定日期區間，含分公司代號/中文）
├── ui.gs                             # Google Apps Script — Sheets 自訂選單（onOpen）
├── cwsspa016.4gl                     # 後端 API 原始碼 — 取得戰報明細（Genero BDL）
├── cwsspa017.4gl                     # 後端 API 原始碼 — 取得客戶明細（Genero BDL）
├── cwsspa018.4gl                     # 後端 API 原始碼 — 取得客戶應收票據明細（Genero BDL）
├── cwsspa019.4gl                     # 後端 API 原始碼 — 取得沖銷單明細（Genero BDL）
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
| 切結明細 API | `cwsspa018` / `get.anm.nmbblist` |
| 沖銷明細 API | `cwsspa019` / `get.axr.apdalist` |
| 業績明細鎖定格 | `資料寫入紀錄與判定!F1` |
| 客戶明細鎖定格 | `資料寫入紀錄與判定!H1` |
| 切結明細鎖定格 | `資料寫入紀錄與判定!J1` |
| 切結轉神寶鎖定格 | `資料寫入紀錄與判定!L1` |

## 重要機制摘要

**分散式鎖**：多台主機競爭時以 Sheets 儲存格做互斥鎖，寫入前讀鎖、等 1.5 秒再確認、完成後釋放。詳見 [README.md#分散式鎖定機制](README.md#分散式鎖定機制)。

**日期計算（業績明細）**：AutoDate 版本以「3 年前的 10/1」為起點，向前調整直到區間 ≤ 2 年。必須用 `toLocalDateStr()` 而非 `toISOString()`（UTC 偏移會把 10/1 變 9/30）。詳見 [README.md#日期計算autodate-版本](README.md#日期計算autodate-版本)。

**日期計算（切結/沖銷）**：AutoDate 版本以今天月份判斷——1～10 月取去年 11/1～今年 10/31，11～12 月取今年 11/1～明年 10/31。同樣使用 `toLocalDateStr()` 避免 UTC 偏移。

**月初卡控**：每月 1 日 07:00 自動將 L3 設為 `月初確認`，阻擋寄信直到人工確認 C2 日期並從選單解除。詳見 [README.md#setmonthendholdgs](README.md#setmonthendholdgs)。

**dateSwitch**：業績明細 API 有 5 個 SQL 切換（1=出庫、2=有來源退庫、3=無來源退庫、4=訂單非S05、5=訂單S05），JS 腳本呼叫 1~5，後端另有 6 未使用。詳見 [README.md#dateswitch-說明](README.md#dateswitch-說明)。

**68夏季活動篩選**：`sent68SummerReport.gs` 寄出前篩選 `68夏季活動` 工作表，第 1~3 行無條件輸出，第 4 行起僅保留 E 欄不為空的列；PDF 與 Excel 均從篩選後的 tempSS 匯出。控制頁為 `夏日活動計算`，儲存格配置同 `06戰報日期區間`。詳見 [README.md#sent68summerreportgs](README.md#sent68summerreportgs)。

**99年度獎金篩選**：`sent99AnnualBonus.gs` 寄出前篩選 `99年度獎金` 工作表，第 1~3 行無條件輸出，第 4 行起僅保留 D 欄不為空的列；PDF 與 Excel 均從篩選後的 tempSS 匯出。控制頁為 `99年度獎金計算`，儲存格配置同 `夏日活動計算`。詳見 [README.md#sent99annualbonusgs](README.md#sent99annualbonusgs)。

**業績明細匯出給財務**：`exportSalesDataForFinance.gs` 從選單跳出提示框輸入起訖日期，篩選 `業績明細` 中『單據日期』落在區間內的資料，並排除『銷售通路』或『分公司代號（取自 P 欄「戰報分區」）』為空白的列。左側加入 單別（依單據單號前 6 碼判定）／分公司代號（P 欄原值）／中文（對照 `SALES_AREA_MAP_`）三欄後匯出無公式 xlsx。詳見 [README.md#exportsalesdataforfinancegs](README.md#exportsalesdataforfinancegs)。
