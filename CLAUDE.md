# GoogleBattleReport

將 T100 ERP 系統資料同步至 Google Sheets 的 Node.js 腳本集。

## 專案結構

```
GoogleBattleReport/
├── GoogleBattelReportAutoDate.js     # 業績明細 — 正式環境，日期自動計算
├── GoogleBattelReportAutoDateTest.js # 業績明細 — 測試環境，日期自動計算
├── GoogleBattelReportFreeDate.js     # 業績明細 — 日期手動設定版本
├── GoogleBattelReportFreeDateTest.js # 業績明細 — 測試環境，日期手動設定
├── GoogleCustomerDe.js               # 客戶明細 — 正式環境
├── customerListTest.js               # 客戶明細 — 測試環境
├── cwsspa016.4gl                     # 後端 API 原始碼 — 取得戰報明細（Genero BDL）
├── cwsspa017.4gl                     # 後端 API 原始碼 — 取得客戶明細（Genero BDL）
├── t100erpinport-a72dfbb03006.json   # Google Service Account 金鑰（勿提交，已 gitignore）
├── 業績明細上傳紀錄.log
└── 客戶明細上傳紀錄.log
```

## 環境說明

| 常數 `ENV` | API 路徑 |
|---|---|
| `topprd` | `http://192.168.70.107/wstopprd/ws/r/awsp920` |
| `toptst` | `http://192.168.70.107/wtoptst/ws/r/awsp920` |

正式腳本使用 `topprd`，測試腳本使用 `toptst`。

## Google Sheets 目標

- Spreadsheet ID: `1JrR6saVcWD6K0h6J67cgfHz6VDcDRRDMIHseu_f_Nzs`
- 工作表 `業績明細` / `業績明細測試`：A~N 欄，從第 2 列開始
- 工作表 `客戶明細` / `客戶明細測試`：A~Z 欄，從第 2 列開始
- 工作表 `資料寫入紀錄與判定`：記錄每次執行結果（A=時間、B=主機名、C=狀態）

## 分散式鎖定機制

多台主機可能同時執行，用 Google Sheets 某個儲存格做互斥鎖：

- 業績明細使用 `資料寫入紀錄與判定!F1`
- 客戶明細使用 `資料寫入紀錄與判定!H1`

流程：
1. 讀取鎖定儲存格，若有值則中止
2. 寫入 `時間 + 主機名稱` 作為鎖定值
3. 等待 1.5 秒後再讀一次確認（降低極端競爭）
4. 完成後（成功或失敗）清空鎖定儲存格並寫入執行紀錄

## 業績明細腳本

### API 資訊
- 後端程式：`cwsspa016`（取得戰報明細，Genero BDL）
- 服務名稱：`get.xmd.outboundlist`（測試：`get.xmd.outboundlist.test`）
- 每頁筆數：5000 筆（後端固定）
- 支援分頁，每個 dateSwitch 獨立分頁撈取

### 傳入參數

| 參數 | 必填 | 說明 |
|---|---|---|
| `EntId` | 是 | 集團編號（固定 `1`）|
| `CompanyId` | 是 | 據點編號（固定 `BD01`）|
| `startdate` | 是 | 起始日期（`YYYY-MM-DD`）|
| `enddate` | 是 | 結束日期（`YYYY-MM-DD`）|
| `dateSwitch` | 是 | SQL 切換（`1`~`5`，見下表）|
| `pageNo` | 否 | 頁碼（預設 `1`）|

### dateSwitch 說明

| 值 | 資料來源 | 邏輯說明 |
|---|---|---|
| `1` | xmdk + xmdl + xmdc + xmda + imaf | 出庫單（xmdk000=1），非 S05/S05-1 通路，xmdc049 IS NULL，排除料件 Z-01 |
| `2` | xmdk + xmdl + imaf | 退出庫單（xmdk000=6），**有來源單號**，有通路篩選（非 S05），金額乘 -1 |
| `3` | xmdk + xmdl + imaf | 退出庫單（xmdk000=6），**無來源單號**，xmdk030 IS NOT NULL |
| `4` | xmdc + xmda + imaf | 銷售訂單明細，xmdc049='A01'，非 S05/S05-1 通路 |
| `5` | xmdc + xmda + imaf | 銷售訂單明細，**僅 S05/S05-1 通路** |
| `6` | xmdk + xmdl + imaf | 退出庫單（xmdk000=6），有來源單號，**無通路篩選**（後端有此 switch，JS 腳本目前未呼叫）|

### 涉及的資料庫資料表

| 資料表 | 說明 |
|---|---|
| `xmdk_t` | 出庫單頭 |
| `xmdl_t` | 出庫單明細 |
| `xmdc_t` | 銷售訂單明細 |
| `xmda_t` | 銷售訂單頭 |
| `imaf_t` | 品項資料（取銷售分群 IMAF111）|

### 回傳結構

```json
{
  "pageNo": 1,
  "pageSize": 5000,
  "totalCount": 12345,
  "totalPages": 3,
  "master": [ { ...14 欄位... } ]
}
```

### 欄位對應（14 欄）

| 欄 | 欄位名稱 | 說明 |
|---|---|---|
| A | l_xmdkdocno | 出庫單號 |
| B | l_xmdk007 | 客戶 |
| C | l_xmda023 | 銷售通路 |
| D | l_xmdlseq | 項次 |
| E | l_xmdc001 | 料件編號 |
| F | l_xmdl022 | 數量 |
| G | l_xmdl027 | 未稅金額 |
| H | l_xmdl028 | 含稅金額 |
| I | l_xmdl029 | 稅額 |
| J | l_xmdl003 | 來源單號 |
| K | l_xmdkdocdt | 出庫日期（YYYY-MM-DD）|
| L | l_imaf111 | 銷售分群 |
| M | l_xmdl888 | 計級計獎 |
| N | l_xmdl999 | 補空格 / XMDC049 |

### 日期計算（AutoDate 版本）
從今天回推，startdate 為「3 年前的 10 月 1 日」開始，但確保區間不超過 2 年：
```js
let startdate = new Date(today.getFullYear() - 3, 9, 1);
while ((today - startdate) > TWO_YEARS_MS) {
    startdate.setFullYear(startdate.getFullYear() + 1);
}
```

## 客戶明細腳本

### API 資訊
- 後端程式：`cwsspa017`（取得客戶明細，Genero BDL）
- 服務名稱：`get.pmaa.customerlist`（測試：`get.pmaa.customerlist.test`）
- 單次呼叫，**無分頁**，一次回傳全部資料

### 傳入參數

| 參數 | 必填 | 說明 |
|---|---|---|
| `EntId` | 是 | 集團編號（固定 `1`）|

### 涉及的資料庫資料表

| 資料表 | 說明 |
|---|---|
| `pmaa_t` | 交易對象主檔 |
| `pmaal_t` | 交易對象多語言描述（取 `pmaal002 = 'zh_TW'`）|

查詢條件：`pmaa002 <> '1'`（排除類型為 `1` 的對象，即非客戶類型）

### 回傳結構

```json
{
  "master": [ { ...18 欄位... } ]
}
```

無分頁欄位（pageNo / totalCount），直接回傳 master 陣列。

### 欄位對應（18 欄）

| 欄 | 欄位名稱 | 說明 |
|---|---|---|
| A | l_pmaa001 | 交易對象編號 |
| B | l_pmaal003 | 名稱（zh_TW）|
| C | l_pmaal004 | 簡稱（zh_TW）|
| D | l_pmaa002 | 交易對象類型 |
| E | l_pmaa003 | 統一編號 |
| F | l_pmaa005 | 所屬法人 |
| G | l_pmaa090 | 客戶分類 |
| H | l_pmaa091 | 客戶價格群組 |
| I | l_pmaa291 | 客戶其他屬性一 |
| J | l_pmaa292 | 客戶其他屬性二 |
| K | l_pmaa293 | 客戶其他屬性三 |
| L | l_pmaa294 | 客戶其他屬性四 |
| M | l_pmaa295 | 客戶其他屬性五 |
| N | l_pmaa296 | 客戶其他屬性六 |
| O | l_pmaa297 | 客戶其他屬性七 |
| P | l_pmaa298 | 客戶其他屬性八 |
| Q | l_pmaa299 | 客戶其他屬性九 |
| R | l_pmaa300 | 客戶其他屬性十 |

## 執行方式

```bash
node GoogleBattelReportAutoDate.js   # 業績明細（正式）
node GoogleCustomerDe.js             # 客戶明細（正式）
```

## 相依套件

```bash
npm install axios googleapis
```

## 注意事項

- `t100erpinport-a72dfbb03006.json` 是 Google Service Account 私鑰，不可提交至版本控制
- 腳本每次執行都會**清空後全量覆寫**，不做增量更新
- Log 檔案以 append 模式寫入，不會自動輪替
