#該程式未解開Section, 採用最新樣板產出!
#該程式為freestyle程式!
{<section id="cwsspa019.description" type="s" >}
#應用 a00 樣板自動產生(Version:3)
#+ Standard Version.....: SD版次:0001(1900-01-01 00:00:00), PR版次:
#+ Customerized Version.: SD版次:0001(1900-01-01 00:00:00), PR版次:
#+ Build......: 000000
#+ Filename...: cwsspa019
#+ Description: 取得切結轉神寶明細
#+ Creator....: 1120424001(2026-06-10 08:59:20)
#+ Modifier...: 00000 -SD/PR-

{</section>}

{<section id="cwsspa019.global" type="s" >}
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
            l_apcedocno        STRING,               #沖銷單單號
            l_apdadocdt        STRING,               #單據日期
            l_apda005          STRING,               #付款對象
            l_apceseq          STRING,               #項次
            l_apce001          STRING,               #來源作業
            l_apce003          STRING,               #沖銷帳款單單號
            l_apce004          STRING,               #沖銷帳款單項次
            l_apce119          DECIMAL(18,2)          #本幣沖帳金額
   END RECORD

#toptst-c260610-001 260610 add by sjhong -e

#end add-point

{</section>}

{<section id="cwsspa019.main" type="s" >}
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
      CALL cwsspa019_process()
   END IF

   #呼叫服務後置處理程序
   CALL awsp900_01_postprocess()

   #離開作業
   CALL cl_wss_exit()

END MAIN

{</section>}

{<section id="cwsspa019.process" type="s" >}
#+ 實際處理服務程式邏輯的FUNCTION內容
PRIVATE FUNCTION cwsspa019_process() RETURNS ()   #200213-00032
   #add-point: 服務邏輯主要處理段的ADP name="cwsspa019.process"

#toptst-c260610-001 260610 add by sjhong -s

   DEFINE l_ent          STRING                      #集團編號
   DEFINE l_sql          STRING                      #SQL
   DEFINE l_str          STRING                      #訊息
   DEFINE l_start_date   STRING                      #起始日期
   DEFINE l_end_date     STRING                      #結束日期
   DEFINE lr_i           INTEGER                     #陣列索引

   DEFINE l_msg_parameter RECORD
            l_apcedocno        STRING,
            l_apdadocdt        STRING,
            l_apda005          STRING,
            l_apceseq          STRING,
            l_apce001          STRING,
            l_apce003          STRING,
            l_apce004          STRING,
            l_apce119          DECIMAL(18,2),
            messages           STRING
   END RECORD

   DEFINE rec RECORD
            l_apcedocno        STRING,
            l_apdadocdt        STRING,
            l_apda005          STRING,
            l_apceseq          STRING,
            l_apce001          STRING,
            l_apce003          STRING,
            l_apce004          STRING,
            l_apce119          DECIMAL(18,2)
   END RECORD

   DEFINE lr_return    RECORD
            master      DYNAMIC ARRAY OF RECORD
               l_apcedocno    STRING,
               l_apdadocdt    STRING,
               l_apda005      STRING,
               l_apceseq      STRING,
               l_apce001      STRING,
               l_apce003      STRING,
               l_apce004      STRING,
               l_apce119      DECIMAL(18,2)
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

   #── 組 SQL：查詢沖銷單明細，串接 apda_t 取單據日期與付款對象 ──
   LET l_sql = " SELECT apce.apcedocno, apda.apdadocdt, " ,
               "        apda.apda005, " ,
               "        apce.apceseq, apce.apce001, " ,
               "        apce.apce003, apce.apce004, " ,
               "        apce.apce119 " ,
               " FROM apce_t apce " ,
               " LEFT JOIN apda_t apda " ,
               "    ON apda.apdadocno = apce.apcedocno " ,
               " WHERE apce.apceent   = ",l_ent ,
               "   AND apce.apcecomp  = 'BD01' " ,
               "   AND apce.apcesite  = 'BD01' " ,
               "   AND apda.apda018   = '0005' " ,
               "   AND apda.apdadocdt BETWEEN TO_DATE('",l_start_date,"', 'YYYY-MM-DD') " ,
               "                          AND TO_DATE('",l_end_date,"', 'YYYY-MM-DD') "

   #── 執行查詢 ──
   WHENEVER ERROR CONTINUE

   PREPARE cwsspa019_pb FROM l_sql
   IF SQLCA.SQLCODE THEN
      LET g_status.code = SQLCA.SQLCODE
      LET l_msg_parameter.messages = "PREPARE 失敗: ", cl_getmsg(g_status.code,g_lang)
      CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(l_msg_parameter))
      WHENEVER ERROR STOP
      RETURN
   END IF

   DECLARE cwsspa019_cs CURSOR FOR cwsspa019_pb
   IF SQLCA.SQLCODE THEN
      LET g_status.code = SQLCA.SQLCODE
      LET l_msg_parameter.messages = "DECLARE 失敗: ", cl_getmsg(g_status.code,g_lang)
      CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(l_msg_parameter))
      WHENEVER ERROR STOP
      RETURN
   END IF

   LET lr_i = 1
   INITIALIZE lr_return TO NULL

   FOREACH cwsspa019_cs INTO rec.*

      IF SQLCA.SQLCODE IS NOT NULL AND SQLCA.SQLCODE <> 0 AND SQLCA.SQLCODE <> 100 THEN
         LET g_status.code = SQLCA.SQLCODE
         LET l_msg_parameter.messages = "FETCH 失敗: ", cl_getmsg(g_status.code,g_lang)
         CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(l_msg_parameter))
         EXIT FOREACH
      END IF

      LET lr_return.master[lr_i].l_apcedocno = rec.l_apcedocno
      LET lr_return.master[lr_i].l_apdadocdt = rec.l_apdadocdt
      LET lr_return.master[lr_i].l_apda005   = rec.l_apda005
      LET lr_return.master[lr_i].l_apceseq   = rec.l_apceseq
      LET lr_return.master[lr_i].l_apce001   = rec.l_apce001
      LET lr_return.master[lr_i].l_apce003   = rec.l_apce003
      LET lr_return.master[lr_i].l_apce004   = rec.l_apce004
      LET lr_return.master[lr_i].l_apce119   = rec.l_apce119
      LET lr_i = lr_i + 1

   END FOREACH

   WHENEVER ERROR STOP

   CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(lr_return))

#toptst-c260610-001 260610 add by sjhong -e

   #end add-point
END FUNCTION

{</section>}

{<section id="cwsspa019.other_function" readonly="Y" type="s" >}
#add-point:自定義元件(Function) name="other.function"

#end add-point

{</section>}