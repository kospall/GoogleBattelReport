{<section id="cwsspa016.description" type="s" >}
#應用 a00 樣板自動產生(Version:3)
#+ Standard Version.....: SD版次:0002(1900-01-01 00:00:00), PR版次:
#+ Customerized Version.: SD版次:0001(1900-01-01 00:00:00), PR版次:
#+ Build......: 000001
#+ Filename...: cwsspa016
#+ Description: 取得戰報明細
#+ Creator....: 1120424001(2026-04-15 14:57:25)
#+ Modifier...: 00000 -SD/PR-
{</section>}

{<section id="cwsspa016.global" type="s" >}
#應用 m00 樣板自動產生(Version:13)
#add-point:填寫註解說明 name="global.memo"
#Memos
#end add-point
#add-point:填寫註解說明(客製用) name="global.memo_customerization"

#end add-point

IMPORT os
IMPORT xml
#add-point:增加匯入項目 name="global.import"
IMPORT util # JSON使用lib  #toptst-c260416-001 add by sjhong
#end add-point

SCHEMA ds

GLOBALS "../../cfg/top_global.inc"
GLOBALS "../../cfg/top_ws.inc"     #TIPTOP Service Gateway 使用的全域變數檔
#add-point:自定義模組變數(Module Variable) name="global.variable"

#end add-point

#add-point:自定義客戶專用模組變數(Module Variable) name="global.variable_customerization"

#toptst-c260416-001 add by sjhong-start

PRIVATE TYPE   type_return  RECORD
            l_xmdkdocno        STRING,               #出庫單號
            l_xmdk007          STRING,               #客戶
            l_xmda023          STRING,               #銷售通路
            l_xmdlseq          INTEGER,              #項次
            l_xmdc001          STRING,               #料件編號
            l_xmdl022          DECIMAL(18,2),        #數量
            l_xmdl027          DECIMAL(18,2),        #未稅金額
            l_xmdl028          DECIMAL(18,2),        #含稅金額
            l_xmdl029          DECIMAL(18,2),        #稅額
            l_xmdl003          STRING,               #來源單號
            l_xmdkdocdt        STRING,               #出庫日期 (YYYY-MM-DD)
            l_imaf111          STRING,               #銷售分群
            l_xmdl888          STRING,               #計級計獎
            l_xmdl999          STRING                #補空格/XMDC049
   END RECORD

#toptst-c260416-001 add by sjhong-end

#end add-point

{</section>}

{<section id="cwsspa016.main" type="s" >}
#+ 作業開始
MAIN
   DEFINE l_request_str  STRING
   DEFINE l_output_str   STRING
   #add-point:main段define name="main.define"

   #end add-point
   #add-point:main段define name="main.define_customerization"

   #end add-point

   #定義在其他link的程式則無效
   WHENEVER ERROR CALL cl_err_msg_log

   #add-point:初始化前定義 name="main.before_ap_init"

   #end add-point

   #wss進行初始化設定(web services)
   CALL cl_wss_init()

   #呼叫服務前置處理程序
   CALL awsp900_01_preprocess()

   #呼叫服務函式，中介程式主要處理段
   IF g_status.code = "0" THEN
      CALL cwsspa016_process()
   END IF

   #呼叫服務後置處理程序
   CALL awsp900_01_postprocess()

   #離開作業
   CALL cl_wss_exit()

END MAIN

{</section>}

{<section id="cwsspa016.process" type="s" >}
#+ 實際處理服務程式邏輯的FUNCTION內容
PRIVATE FUNCTION cwsspa016_process() RETURNS ()   #200213-00032
   #add-point: 服務邏輯主要處理段的ADP name="cwsspa016.process"

#toptst-c260416-001 add by sjhong-start

   DEFINE l_ent          LIKE xmdk_t.xmdkent        #集團編號
   DEFINE l_company      LIKE xmdk_t.xmdksite       #據點編號
   DEFINE l_sql          STRING                     #SQL
   DEFINE l_str          STRING                     #訊息
   DEFINE l_start_date   STRING                     #起始日期
   DEFINE l_end_date     STRING                     #結束日期
   DEFINE l_dateSwitch   STRING                     #SQL切換
   DEFINE l_pageNo       INTEGER                    #頁碼
   DEFINE l_pageSize     INTEGER                    #每頁筆數
   DEFINE l_skipCount    INTEGER                    #需跳過筆數
   DEFINE l_totalCount   INTEGER                    #總筆數
   DEFINE lr_i           INTEGER                    #陣列索引

   DEFINE l_msg_parameter  RECORD
            l_xmdkdocno        STRING,              #出庫單號
            l_xmdk007          STRING,              #客戶
            l_xmda023          STRING,              #銷售通路
            l_xmdlseq          INTEGER,             #項次
            l_xmdc001          STRING,              #料件編號
            l_xmdl022          DECIMAL(18,2),       #數量
            l_xmdl027          DECIMAL(18,2),       #未稅金額
            l_xmdl028          DECIMAL(18,2),       #含稅金額
            l_xmdl029          DECIMAL(18,2),       #稅額
            l_xmdl003          STRING,              #來源單號
            l_xmdkdocdt        STRING,              #出庫日期 (YYYY-MM-DD)
            l_imaf111          STRING,              #銷售分群
            l_xmdl888          STRING,              #計級計獎
            l_xmdl999          STRING,              #補空格/XMDC049
            messages           STRING
   END RECORD

   #── 對應 SELECT 14 個欄位的接收 RECORD ──
   DEFINE rec RECORD
            l_xmdkdocno        STRING,
            l_xmdk007          STRING,
            l_xmda023          STRING,
            l_xmdlseq          INTEGER,
            l_xmdc001          STRING,
            l_xmdl022          DECIMAL(18,2),
            l_xmdl027          DECIMAL(18,2),
            l_xmdl028          DECIMAL(18,2),
            l_xmdl029          DECIMAL(18,2),
            l_xmdl003          STRING,
            l_xmdkdocdt        STRING,
            l_imaf111          STRING,
            l_xmdl888          STRING,
            l_xmdl999          STRING
   END RECORD

   DEFINE lr_return    RECORD
            pageNo      INTEGER,                    #目前頁碼
            pageSize    INTEGER,                    #每頁筆數
            totalCount  INTEGER,                    #總筆數
            totalPages  INTEGER,                    #總頁數
            master      DYNAMIC ARRAY OF RECORD
               l_xmdkdocno    STRING,
               l_xmdk007      STRING,
               l_xmda023      STRING,
               l_xmdlseq      INTEGER,
               l_xmdc001      STRING,
               l_xmdl022      DECIMAL(18,2),
               l_xmdl027      DECIMAL(18,2),
               l_xmdl028      DECIMAL(18,2),
               l_xmdl029      DECIMAL(18,2),
               l_xmdl003      STRING,
               l_xmdkdocdt    STRING,
               l_imaf111      STRING,
               l_xmdl888      STRING,
               l_xmdl999      STRING
            END RECORD
   END RECORD

   #── 接收傳入參數 ──
   LET l_ent = cl_aws_json_getValue("datakey","EntId")

   IF cl_null(l_ent) THEN
      LET g_status.code = "-1"
      LET l_str = cl_replace_err_msg(cl_getmsg('wss-00138',g_dlang),'l_ent')
      LET g_status.description = l_str
      RETURN
   END IF

   LET l_company     = cl_aws_json_getValue("datakey","CompanyId")
   LET l_start_date  = cl_aws_json_getValue("datakey","startdate")
   LET l_end_date    = cl_aws_json_getValue("datakey","enddate")
   LET l_dateSwitch  = cl_aws_json_getValue("datakey","dateSwitch")

   LET l_company     = l_company    CLIPPED
   LET l_start_date  = l_start_date CLIPPED
   LET l_end_date    = l_end_date   CLIPPED
   LET l_dateSwitch  = l_dateSwitch CLIPPED

   #── 必要參數檢查 ──
   IF cl_null(l_company) THEN
      LET g_status.code = "-1"
      LET g_status.description = "CompanyId 不可為空"
      RETURN
   END IF

   IF cl_null(l_start_date) OR cl_null(l_end_date) THEN
      LET g_status.code = "-1"
      LET g_status.description = "startdate / enddate 不可為空"
      RETURN
   END IF

   IF cl_null(l_dateSwitch) THEN
      LET g_status.code = "-1"
      LET g_status.description = "dateSwitch 不可為空"
      RETURN
   END IF

   #── 資料筆數分頁 每5000筆一頁 ──
   LET l_pageNo = cl_aws_json_getValue("datakey","pageNo")
   IF cl_null(l_pageNo) OR l_pageNo < 1 THEN
      LET l_pageNo = 1
   END IF
   LET l_pageSize  = 5000
   LET l_skipCount = (l_pageNo - 1) * l_pageSize

   #── 依 dateSwitch 切換 SQL ──
   CASE l_dateSwitch

      WHEN "1"   #--- SQL1: xmdk+xmdc+xmda xmdk000=1 非S05通路 ---
         LET l_sql = " SELECT xk.XMDKDOCNO, xk.XMDK007, xsh.XMDA023, xld.XMDLSEQ, xc.XMDC001, " ,
                     "        xld.XMDL022, xld.XMDL027, xld.XMDL028, xld.XMDL029, xld.XMDL003, " ,
                     "        TO_CHAR(xk.XMDKDOCDT,'YYYY-MM-DD') AS XMDKDOCDT, im.IMAF111, " ,
                     "        '計級計獎' AS l_xmdl888, '補空格' AS l_xmdl999 " ,
                     " FROM xmdk_t xk " ,
                     " INNER JOIN xmdl_t xld " ,
                     "    ON xk.xmdkent   = xld.xmdlent " ,
                     "   AND xk.xmdksite  = xld.xmdlsite " ,
                     "   AND xk.xmdkdocno = xld.xmdldocno " ,
                     " INNER JOIN xmdc_t xc " ,
                     "    ON xld.XMDL003  = xc.XMDCDOCNO " ,
                     "   AND xld.XMDL004  = xc.XMDCSEQ " ,
                     "   AND xld.XMDLENT  = xc.XMDCENT " ,
                     "   AND xld.XMDLSITE = xc.XMDCSITE " ,
                     " INNER JOIN xmda_t xsh " ,
                     "    ON xc.xmdcent   = xsh.xmdaent " ,
                     "   AND xc.xmdcsite  = xsh.xmdasite " ,
                     "   AND xc.xmdcdocno = xsh.xmdadocno " ,
                     " LEFT JOIN IMAF_T im " ,
                     "    ON xld.XMDL008  = im.IMAF001 " ,
                     "   AND im.imafent   = xld.xmdlent " ,
                     "   AND im.imafsite  = xld.xmdlsite " ,
                     " WHERE xk.xmdkent   = ",l_ent ,
                     "   AND xk.xmdksite  = '",l_company,"' " ,
                     "   AND xk.xmdkstus  = 'S' " ,
                     "   AND xk.xmdk000   = 1 " ,
                     "   AND xk.XMDKDOCDT BETWEEN TO_DATE('",l_start_date,"', 'YYYY-MM-DD') " ,
                     "                        AND TO_DATE('",l_end_date,"', 'YYYY-MM-DD') " ,
                     "   AND xc.XMDC049   IS NULL " ,
                     "   AND xsh.XMDA005  = 1 " ,
                     "   AND xsh.XMDA023  NOT IN ('S05', 'S05-1') " ,
                     "   AND xsh.XMDA023  IS NOT NULL ",
                     "   AND xc.XMDC001   NOT IN ('Z-01') "

      WHEN "2"   #--- SQL2: xmdk xmdk000=6 有來源單號 有通路篩選 ---
         LET l_sql = " SELECT xk.XMDKDOCNO, xk.XMDK007, xk.XMDK030, xld.XMDLSEQ, xld.XMDL008, " ,
                     "        xld.XMDL022 * -1 AS XMDL022, " ,
                     "        xld.XMDL027 * -1 AS XMDL027, " ,
                     "        xld.XMDL028 * -1 AS XMDL028, " ,
                     "        xld.XMDL029 * -1 AS XMDL029, " ,
                     "        xld.XMDL001 AS XMDL003, " ,
                     "        TO_CHAR(xk.XMDKDOCDT,'YYYY-MM-DD') AS XMDKDOCDT, im.IMAF111, " ,
                     "        '計級計獎' AS l_xmdl888, '補空格' AS l_xmdl999 " ,
                     " FROM xmdk_t xk " ,
                     " INNER JOIN xmdl_t xld " ,
                     "    ON xk.xmdkent   = xld.xmdlent " ,
                     "   AND xk.xmdksite  = xld.xmdlsite " ,
                     "   AND xk.xmdkdocno = xld.xmdldocno " ,
                     " LEFT JOIN IMAF_T im " ,
                     "    ON xld.XMDL008  = im.IMAF001 " ,
                     "   AND im.imafent   = xld.xmdlent " ,
                     "   AND im.imafsite  = xld.xmdlsite " ,
                     " WHERE xk.xmdkent   = ",l_ent ,
                     "   AND xk.xmdksite  = '",l_company,"' " ,
                     "   AND xk.xmdkstus  = 'S' " ,
                     "   AND xk.xmdk000   = 6 " ,
                     "   AND xk.XMDKDOCDT BETWEEN TO_DATE('",l_start_date,"', 'YYYY-MM-DD') " ,
                     "                        AND TO_DATE('",l_end_date,"', 'YYYY-MM-DD') " ,
                     "   AND xld.XMDL008  NOT IN ('Z-01') " ,
                     "   AND xk.XMDK030   NOT IN ('S05', 'S05-1') " ,
                     "   AND xk.XMDK030   IS NOT NULL " ,
                     "   AND xld.XMDL003  IS NOT NULL "

      WHEN "3"   #--- SQL3: xmdk xmdk000=6 無來源單號 ---
         LET l_sql = " SELECT xk.XMDKDOCNO, xk.XMDK007, xk.XMDK030, xld.XMDLSEQ, xld.XMDL008, " ,
                     "        xld.XMDL022 * -1 AS XMDL022, " ,
                     "        xld.XMDL027 * -1 AS XMDL027, " ,
                     "        xld.XMDL028 * -1 AS XMDL028, " ,
                     "        xld.XMDL029 * -1 AS XMDL029, " ,
                     "        xld.XMDL001 AS XMDL003, " ,
                     "        TO_CHAR(xk.XMDKDOCDT,'YYYY-MM-DD') AS XMDKDOCDT, im.IMAF111, " ,
                     "        '計級計獎' AS l_xmdl888, '補空格' AS l_xmdl999 " ,
                     " FROM xmdk_t xk " ,
                     " INNER JOIN xmdl_t xld " ,
                     "    ON xk.xmdkent   = xld.xmdlent " ,
                     "   AND xk.xmdksite  = xld.xmdlsite " ,
                     "   AND xk.xmdkdocno = xld.xmdldocno " ,
                     " LEFT JOIN IMAF_T im " ,
                     "    ON xld.XMDL008  = im.IMAF001 " ,
                     "   AND im.imafent   = xld.xmdlent " ,
                     "   AND im.imafsite  = xld.xmdlsite " ,
                     " WHERE xk.xmdkent   = ",l_ent ,
                     "   AND xk.xmdksite  = '",l_company,"' " ,
                     "   AND xk.xmdkstus  = 'S' " ,
                     "   AND xk.xmdk000   = 6 " ,
                     "   AND xk.XMDKDOCDT BETWEEN TO_DATE('",l_start_date,"', 'YYYY-MM-DD') " ,
                     "                        AND TO_DATE('",l_end_date,"', 'YYYY-MM-DD') " ,
                     "   AND xld.XMDL008  NOT IN ('Z-01') " ,
                     "   AND xk.XMDK030   IS NOT NULL " ,
                     "   AND xld.XMDL003  IS NULL "

      WHEN "4"   #--- SQL4: xmdc+xmda XMDC049='A01' 非S05通路 ---
         LET l_sql = " SELECT xa.XMDADOCNO, xa.XMDA004, xa.XMDA023, xsh.XMDCSEQ, xsh.XMDC001, " ,
                     "        xsh.XMDC011, xsh.XMDC046, xsh.XMDC047, xsh.XMDC048, xa.XMDADOCNO, " ,
                     "        TO_CHAR(xa.XMDADOCDT,'YYYY-MM-DD') AS XMDADOCDT, im.IMAF111, " ,
                     "        '計級計獎' AS l_xmdl888, xsh.XMDC049 " ,
                     " FROM xmdc_t xsh " ,
                     " INNER JOIN xmda_t xa " ,
                     "    ON xsh.xmdcent   = xa.xmdaent " ,
                     "   AND xsh.xmdcsite  = xa.xmdasite " ,
                     "   AND xsh.xmdcdocno = xa.xmdadocno " ,
                     " LEFT JOIN IMAF_T im " ,
                     "    ON xsh.XMDC001   = im.IMAF001 " ,
                     "   AND im.imafent    = xsh.xmdcent " ,
                     "   AND im.imafsite   = xsh.xmdcsite " ,
                     " WHERE xsh.xmdcent   = ",l_ent ,
                     "   AND xsh.xmdcsite  = '",l_company,"' " ,
                     "   AND xsh.XMDC049   = 'A01' " ,
                     "   AND xa.XMDA005    = 1 " ,
                     "   AND xa.XMDA023    NOT IN ('S05', 'S05-1') " ,
                     "   AND xsh.XMDC001   NOT IN ('Z-01') " ,
                     "   AND xa.XMDASTUS   = 'Y' " ,
                     "   AND xa.XMDADOCDT BETWEEN TO_DATE('",l_start_date,"', 'YYYY-MM-DD') " ,
                     "                        AND TO_DATE('",l_end_date,"', 'YYYY-MM-DD') ",
                     "   AND xa.XMDA023    IS NOT NULL "

      WHEN "5"   #--- SQL5: xmdc+xmda 只S05通路 ---
         LET l_sql = " SELECT xa.XMDADOCNO, xa.XMDA004, xa.XMDA023, xsh.XMDCSEQ, xsh.XMDC001, " ,
                     "        xsh.XMDC011, xsh.XMDC046, xsh.XMDC047, xsh.XMDC048, xa.XMDADOCNO, " ,
                     "        TO_CHAR(xa.XMDADOCDT,'YYYY-MM-DD') AS XMDADOCDT, im.IMAF111, " ,
                     "        '計級計獎' AS l_xmdl888, xsh.XMDC049 " ,
                     " FROM xmdc_t xsh " ,
                     " INNER JOIN xmda_t xa " ,
                     "    ON xsh.xmdcent   = xa.xmdaent " ,
                     "   AND xsh.xmdcsite  = xa.xmdasite " ,
                     "   AND xsh.xmdcdocno = xa.xmdadocno " ,
                     " LEFT JOIN IMAF_T im " ,
                     "    ON xsh.XMDC001   = im.IMAF001 " ,
                     "   AND im.imafent    = xsh.xmdcent " ,
                     "   AND im.imafsite   = xsh.xmdcsite " ,
                     " WHERE xsh.xmdcent   = ",l_ent ,
                     "   AND xsh.xmdcsite  = '",l_company,"' " ,
                     "   AND xa.XMDA005    = 1 " ,
                     "   AND xa.XMDA023    IN ('S05', 'S05-1') " ,
                     "   AND xsh.XMDC001   NOT IN ('Z-01') " ,
                     "   AND xa.XMDASTUS   = 'Y' " ,
                     "   AND xa.XMDADOCDT BETWEEN TO_DATE('",l_start_date,"', 'YYYY-MM-DD') " ,
                     "                        AND TO_DATE('",l_end_date,"', 'YYYY-MM-DD') ",
                     "   AND xa.XMDA023    IS NOT NULL "

      WHEN "6"   #--- SQL6: xmdk xmdk000=6 有來源單號 無通路篩選 ---
         LET l_sql = " SELECT xk.XMDKDOCNO, xk.XMDK007, xk.XMDK030, xld.XMDLSEQ, xld.XMDL008, " ,
                     "        xld.XMDL022, xld.XMDL027, xld.XMDL028, xld.XMDL029, xld.XMDL001 AS XMDL003, " ,
                     "        TO_CHAR(xk.XMDKDOCDT,'YYYY-MM-DD') AS XMDKDOCDT, im.IMAF111, " ,
                     "        '計級計獎' AS l_xmdl888, '補空格' AS l_xmdl999 " ,
                     " FROM xmdk_t xk " ,
                     " INNER JOIN xmdl_t xld " ,
                     "    ON xk.xmdkent   = xld.xmdlent " ,
                     "   AND xk.xmdksite  = xld.xmdlsite " ,
                     "   AND xk.xmdkdocno = xld.xmdldocno " ,
                     " LEFT JOIN IMAF_T im " ,
                     "    ON xld.XMDL008  = im.IMAF001 " ,
                     "   AND im.imafent   = xld.xmdlent " ,
                     "   AND im.imafsite  = xld.xmdlsite " ,
                     " WHERE xk.xmdkent   = ",l_ent ,
                     "   AND xk.xmdksite  = '",l_company,"' " ,
                     "   AND xk.xmdkstus  = 'S' " ,
                     "   AND xk.xmdk000   = 6 " ,
                     "   AND xk.XMDKDOCDT BETWEEN TO_DATE('",l_start_date,"', 'YYYY-MM-DD') " ,
                     "                        AND TO_DATE('",l_end_date,"', 'YYYY-MM-DD') " ,
                     "   AND xld.XMDL008  NOT IN ('Z-01') " ,
                     "   AND xld.XMDL003  IS NOT NULL "

      OTHERWISE
         LET g_status.code = "-1"
         LET g_status.description = "dateSwitch 參數值無效: ", l_dateSwitch CLIPPED
         RETURN

   END CASE

   #── 執行查詢 ──
   WHENEVER ERROR CONTINUE

   PREPARE cwsspa_new_pb FROM l_sql
   IF SQLCA.SQLCODE THEN
      LET g_status.code = SQLCA.SQLCODE
      LET l_msg_parameter.messages = "PREPARE 失敗: ", cl_getmsg(g_status.code,g_lang)
      CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(l_msg_parameter))
      WHENEVER ERROR STOP
      RETURN
   END IF

   DECLARE cwsspa_new_cs CURSOR FOR cwsspa_new_pb
   IF SQLCA.SQLCODE THEN
      LET g_status.code = SQLCA.SQLCODE
      LET l_msg_parameter.messages = "DECLARE 失敗: ", cl_getmsg(g_status.code,g_lang)
      CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(l_msg_parameter))
      WHENEVER ERROR STOP
      RETURN
   END IF

   LET lr_i = 1
   LET l_totalCount = 0
   INITIALIZE lr_return TO NULL

   FOREACH cwsspa_new_cs INTO rec.*

      #── FOREACH 中抓取資料失敗才視為錯誤（100 是正常結束，不進來）──
      IF SQLCA.SQLCODE IS NOT NULL AND SQLCA.SQLCODE <> 0 AND SQLCA.SQLCODE <> 100 THEN
         LET g_status.code = SQLCA.SQLCODE
         LET l_msg_parameter.messages = "FETCH 失敗: ", cl_getmsg(g_status.code,g_lang)
         CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(l_msg_parameter))
         EXIT FOREACH
      END IF

      LET l_totalCount = l_totalCount + 1

      #── 跳過前面頁的資料 ──
      IF l_totalCount <= l_skipCount THEN
         CONTINUE FOREACH
      END IF

      #── 超過本頁筆數就不再塞入陣列，但繼續計算總筆數 ──
      IF lr_i > l_pageSize THEN
         CONTINUE FOREACH
      END IF

      LET lr_return.master[lr_i].l_xmdkdocno = rec.l_xmdkdocno
      LET lr_return.master[lr_i].l_xmdk007   = rec.l_xmdk007
      LET lr_return.master[lr_i].l_xmda023   = rec.l_xmda023
      LET lr_return.master[lr_i].l_xmdlseq   = rec.l_xmdlseq
      LET lr_return.master[lr_i].l_xmdc001   = rec.l_xmdc001
      LET lr_return.master[lr_i].l_xmdl022   = rec.l_xmdl022
      LET lr_return.master[lr_i].l_xmdl027   = rec.l_xmdl027
      LET lr_return.master[lr_i].l_xmdl028   = rec.l_xmdl028
      LET lr_return.master[lr_i].l_xmdl029   = rec.l_xmdl029
      LET lr_return.master[lr_i].l_xmdl003   = rec.l_xmdl003
      LET lr_return.master[lr_i].l_xmdkdocdt = rec.l_xmdkdocdt
      LET lr_return.master[lr_i].l_imaf111   = rec.l_imaf111
      LET lr_return.master[lr_i].l_xmdl888   = rec.l_xmdl888
      LET lr_return.master[lr_i].l_xmdl999   = rec.l_xmdl999
      LET lr_i = lr_i + 1

   END FOREACH

   WHENEVER ERROR STOP

   #── 組回傳分頁資訊 ──
   LET lr_return.pageNo     = l_pageNo
   LET lr_return.pageSize   = l_pageSize
   LET lr_return.totalCount = l_totalCount
   IF l_totalCount = 0 THEN
      LET lr_return.totalPages = 0
   ELSE
      LET lr_return.totalPages = (l_totalCount + l_pageSize - 1) / l_pageSize
   END IF

   CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(lr_return))

#toptst-c260416-001 add by sjhong-end

   #end add-point
END FUNCTION

{</section>}

{<section id="cwsspa016.other_function" readonly="Y" type="s" >}
#add-point:自定義元件(Function) name="other.function"

#end add-point

{</section>}
