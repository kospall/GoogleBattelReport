#該程式未解開Section, 採用最新樣板產出!
#該程式為freestyle程式!
{<section id="cwsspa018.description" type="s" >}
#應用 a00 樣板自動產生(Version:3)
#+ Standard Version.....: SD版次:0001(1900-01-01 00:00:00), PR版次:
#+ Customerized Version.: SD版次:0001(1900-01-01 00:00:00), PR版次:
#+ Build......: 000000
#+ Filename...: cwsspa018
#+ Description: 取得切結票明細
#+ Creator....: 1120424001(2026-06-10 08:49:05)
#+ Modifier...: 00000 -SD/PR-

{</section>}

{<section id="cwsspa018.global" type="s" >}
#應用 m00 樣板自動產生(Version:13)
#add-point:填寫註解說明 name="global.memo"
#Memos
#end add-point
#add-point:填寫註解說明(客製用) name="global.memo_customerization"

#end add-point
 
IMPORT os
IMPORT xml
#add-point:增加匯入項目 name="global.import"
IMPORT util # JSON使用lib  #toptst-c260610-001 260610 add by sjhong
#end add-point
 
SCHEMA ds
 
GLOBALS "../../cfg/top_global.inc"
GLOBALS "../../cfg/top_ws.inc"     #TIPTOP Service Gateway 使用的全域變數檔
#add-point:自定義模組變數(Module Variable) name="global.variable"

#end add-point
 
#add-point:自定義客戶專用模組變數(Module Variable) name="global.variable_customerization"

#toptst-c260610-001 260610 add by sjhong -s

PRIVATE TYPE type_return RECORD
            l_nmbbdocno        STRING,               #客戶應收票據單號
            l_nmbbseq          STRING,               #客戶應收票據項次
            l_nmbadocdt        STRING,               #收票單號單據日期
            l_nmbb030          STRING,               #客戶應收票據票據號碼
            l_nmbb042          STRING,               #客戶應收票據票況
            l_nmbb031          STRING,               #客戶應收票據到期日
            l_nmbb004          STRING,               #客戶應收票據幣別
            l_nmbb006          DECIMAL(18,2),         #客戶應收票據原幣金額
            l_nmbb026          STRING,               #客戶應收票據交易對象
            l_gzcbl004         STRING                 #票況名稱
   END RECORD

#toptst-c260610-001 260610 add by sjhong -e

#end add-point

{</section>}

{<section id="cwsspa018.main" type="s" >}
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
      CALL cwsspa018_process()
   END IF
        
   #呼叫服務後置處理程序
   CALL awsp900_01_postprocess()    
 
   #離開作業
   CALL cl_wss_exit()
 
END MAIN

{</section>}

{<section id="cwsspa018.process" type="s" >}
#+ 實際處理服務程式邏輯的FUNCTION內容
PRIVATE FUNCTION cwsspa018_process() RETURNS ()   #200213-00032
   #add-point: 服務邏輯主要處理段的ADP name="cwsspa018.process"

#toptst-c260610-001 260610 add by sjhong -s

   DEFINE l_ent          LIKE nmbb_t.nmbbent         #集團編號
   DEFINE l_sql          STRING                      #SQL
   DEFINE l_str          STRING                      #訊息
   DEFINE l_start_date   STRING                      #起始日期
   DEFINE l_end_date     STRING                      #結束日期
   DEFINE lr_i           INTEGER                     #陣列索引

   DEFINE l_msg_parameter RECORD
            l_nmbbdocno        STRING,               #客戶應收票據單號
            l_nmbbseq          STRING,               #客戶應收票據項次
            l_nmbadocdt        STRING,               #收票單號單據日期
            l_nmbb030          STRING,               #客戶應收票據票據號碼
            l_nmbb042          STRING,               #客戶應收票據票況
            l_nmbb031          STRING,               #客戶應收票據到期日
            l_nmbb004          STRING,               #客戶應收票據幣別
            l_nmbb006          DECIMAL(18,2),         #客戶應收票據原幣金額
            l_nmbb026          STRING,               #客戶應收票據交易對象
            l_gzcbl004         STRING,               #票況名稱
            messages           STRING
   END RECORD

   DEFINE rec RECORD
            l_nmbbdocno        STRING,
            l_nmbbseq          STRING,
            l_nmbadocdt        STRING,
            l_nmbb030          STRING,
            l_nmbb042          STRING,
            l_nmbb031          STRING,
            l_nmbb004          STRING,
            l_nmbb006          DECIMAL(18,2),
            l_nmbb026          STRING,
            l_gzcbl004         STRING
   END RECORD

   DEFINE lr_return    RECORD
            master      DYNAMIC ARRAY OF RECORD
               l_nmbbdocno    STRING,
               l_nmbbseq      STRING,
               l_nmbadocdt    STRING,
               l_nmbb030      STRING,
               l_nmbb042      STRING,
               l_nmbb031      STRING,
               l_nmbb004      STRING,
               l_nmbb006      DECIMAL(18,2),
               l_nmbb026      STRING,
               l_gzcbl004     STRING
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

   LET l_start_date  = cl_aws_json_getValue("datakey","startdate")
   LET l_end_date    = cl_aws_json_getValue("datakey","enddate")

   LET l_start_date  = l_start_date CLIPPED
   LET l_end_date    = l_end_date   CLIPPED

   #── 必要參數檢查 ──
   IF cl_null(l_start_date) OR cl_null(l_end_date) THEN
      LET g_status.code = "-1"
      LET g_status.description = "startdate / enddate 不可為空"
      RETURN
   END IF

   #── 組 SQL：查詢客戶應收票據，串接 gzcbl_t 取票況名稱 ──
   LET l_sql = " SELECT nb.NMBBDOCNO, nb.NMBBSEQ, " ,
               "        TO_CHAR(na.NMBADOCDT,'YYYY-MM-DD') AS NMBADOCDT, " ,
               "        nb.NMBB030, nb.NMBB042, " ,
               "        TO_CHAR(nb.NMBB031,'YYYY-MM-DD') AS NMBB031, " ,
               "        nb.NMBB004, nb.NMBB006, nb.NMBB026, " ,
               "        gz.GZCBL004 " ,
               " FROM nmbb_t nb " ,
               " INNER JOIN nmba_t na " ,
               "    ON nb.nmbbent   = na.nmbaent " ,
               "   AND nb.nmbbsite  = na.nmbasite " ,
               "   AND nb.nmbbdocno = na.nmbadocno " ,
               " LEFT JOIN gzcbl_t gz " ,
               "    ON gz.gzcbl001  = '8148' " ,
               "   AND gz.gzcbl002  = nb.nmbb042 " ,
               "   AND gz.gzcbl003  = 'zh_TW' " ,
               " WHERE nb.nmbbent   = ",l_ent ,
               "   AND nb.nmbbcomp  = 'BD01' " ,
               "   AND nb.nmbb028   = '302' " ,
               "   AND nb.NMBB031 BETWEEN TO_DATE('",l_start_date,"', 'YYYY-MM-DD') " ,
               "                      AND TO_DATE('",l_end_date,"', 'YYYY-MM-DD') "

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
   INITIALIZE lr_return TO NULL

   FOREACH cwsspa_new_cs INTO rec.*

      IF SQLCA.SQLCODE IS NOT NULL AND SQLCA.SQLCODE <> 0 AND SQLCA.SQLCODE <> 100 THEN
         LET g_status.code = SQLCA.SQLCODE
         LET l_msg_parameter.messages = "FETCH 失敗: ", cl_getmsg(g_status.code,g_lang)
         CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(l_msg_parameter))
         EXIT FOREACH
      END IF

      LET lr_return.master[lr_i].l_nmbbdocno = rec.l_nmbbdocno
      LET lr_return.master[lr_i].l_nmbbseq   = rec.l_nmbbseq
      LET lr_return.master[lr_i].l_nmbadocdt = rec.l_nmbadocdt
      LET lr_return.master[lr_i].l_nmbb030   = rec.l_nmbb030
      LET lr_return.master[lr_i].l_nmbb042   = rec.l_nmbb042
      LET lr_return.master[lr_i].l_nmbb031   = rec.l_nmbb031
      LET lr_return.master[lr_i].l_nmbb004   = rec.l_nmbb004
      LET lr_return.master[lr_i].l_nmbb006   = rec.l_nmbb006
      LET lr_return.master[lr_i].l_nmbb026   = rec.l_nmbb026
      LET lr_return.master[lr_i].l_gzcbl004  = rec.l_gzcbl004
      LET lr_i = lr_i + 1

   END FOREACH

   WHENEVER ERROR STOP

   CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(lr_return))

#toptst-c260610-001 260610 add by sjhong -e

   #end add-point
END FUNCTION

{</section>}

{<section id="cwsspa018.other_function" readonly="Y" type="s" >}
#add-point:自定義元件(Function) name="other.function"

#end add-point

{</section>}