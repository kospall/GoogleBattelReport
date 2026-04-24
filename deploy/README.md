# 部署套件 — 使用者環境佈置

此資料夾包含在新主機上佈置執行環境所需的全部正式腳本。

## 檔案清單

| 檔案 | 類型 | 說明 |
|---|---|---|
| `GoogleBattelReportAutoDate.js` | Node.js | 業績明細同步（正式，日期自動計算）|
| `GoogleBattelReportFreeDate.js` | Node.js | 業績明細同步（手動指定日期，接受 CLI 參數）|
| `GoogleCustomerDe.js` | Node.js | 客戶明細同步（正式）|
| `setReportSwitchON.js` | Node.js | 將戰報寄信開關設為 ON |
| `runBattleReportSequence.js` | Node.js | 依序執行上述三支腳本的排程入口 |
| `runFreeDateInput.js` | Node.js | 手動上傳互動介面（輸入日期並呼叫 FreeDate）|
| `runFreeDateReport.bat` | BAT | 手動上傳啟動捷徑（雙擊執行）|
| `registerWindowsTask.js` | Node.js | 向 Windows 工作排程器登錄每日排程 |
| `sent04BattleReport.gs` | Apps Script | 貼至 Google Apps Script，負責寄出全國業績戰報（04）|
| `sent06BattleReport.gs` | Apps Script | 貼至 Google Apps Script，負責寄出業績戰報（06）|
| `setMonthEndHold.gs` | Apps Script | 每月 1 日自動將 L3 設為「月初確認」，阻擋寄信直到人工確認日期 |
| `ui.gs` | Apps Script | 貼至 Google Apps Script，在 Sheets 建立「戰報作業」自訂選單 |

## 佈置步驟

### 1. 安裝 Node.js

下載並安裝 Node.js 16 以上版本。

### 2. 放置檔案

將此資料夾內所有 `.js` 檔複製至目標主機的工作目錄（例如 `C:\BattleReport\`）。

### 3. 放置金鑰

將 Google Service Account 金鑰檔案放至相同目錄，命名為：

```
t100erpinport-a72dfbb03006.json
```

### 4. 安裝相依套件

在工作目錄執行：

```cmd
npm install axios googleapis
```

### 5. 測試執行

```cmd
node runBattleReportSequence.js
```

確認三個步驟（業績明細 → 客戶明細 → 寫入ON）依序完成。

### 6. 登錄每日排程

以**系統管理員**身分開啟命令提示字元，執行：

```cmd
node registerWindowsTask.js 08:00
```

將 `08:00` 替換為實際需要的執行時間。

登錄後可用以下指令確認：

```cmd
schtasks /query /tn "GoogleBattleReport" /fo LIST
```

### 7. 設定 Apps Script

將以下四個檔案的內容分別貼至目標 Google Spreadsheet 的 Apps Script 編輯器（各建立一個 .gs 檔案）：

| 檔案 | 說明 |
|---|---|
| `ui.gs` | 自訂選單，提供手動觸發入口與解除卡控 |
| `sent04BattleReport.gs` | 全國業績戰報（04）寄送邏輯 |
| `sent06BattleReport.gs` | 業績戰報（06）寄送邏輯 |
| `setMonthEndHold.gs` | 月初自動卡控與解除卡控邏輯 |

工具函式（`formatDate_` 等）定義於 `sent06BattleReport.gs`，四個檔案共用，**不可重複貼入**。

設定時間觸發器（共三個）：

| 函式 | 類型 | 時間 | 說明 |
|---|---|---|---|
| `setMonthEndHold` | 日計時器 | 07:00–08:00 | 每月 1 日自動設 L3 卡控 |
| `sent04BattleReport` | 日計時器 | 09:00–10:00 | 每日嘗試寄出 04 戰報 |
| `sent06BattleReport` | 日計時器 | 09:00–10:00 | 每日嘗試寄出 06 戰報 |

可再各加一個 `10:00–11:00` 的備援觸發器給寄送函式。

## 手動指定日期上傳

需要補傳特定日期區間的業績明細時，雙擊 `runFreeDateReport.bat`：

1. 輸入起始日期（格式 `YYYY-MM-DD`，例：`2024-01-01`）
2. 輸入結束日期（格式 `YYYY-MM-DD`，例：`2026-04-24`）
3. 確認後按 `Y` 執行，`N` 取消
4. 執行完成後查看畫面輸出與 `業績明細上傳紀錄.log`

> 此功能使用 `GoogleBattelReportFreeDate.js`（正式環境 `topprd`），寫入目標為 `業績明細` 工作表。

## 注意事項

- `t100erpinport-a72dfbb03006.json` 為機密金鑰，**勿分享或提交至版本控制**
- 排程登錄後會在工作目錄產生 `runBattleReport.bat`，為自動產生的中介檔，可忽略
- 執行紀錄寫入 `排程執行紀錄.log`，若有異常請優先查閱此檔案
