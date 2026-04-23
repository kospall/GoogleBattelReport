{<section id="cwsspa017.description" type="s" >}
#應用 a00 樣板自動產生(Version:3)
#+ Standard Version.....: SD版次:0001(1900-01-01 00:00:00), PR版次:
#+ Customerized Version.: SD版次:0001(1900-01-01 00:00:00), PR版次:
#+ Build......: 000000
#+ Filename...: cwsspa017
#+ Description: 取得客戶明細
#+ Creator....: 1120424001(2026-04-15 14:58:14)
#+ Modifier...: 00000 -SD/PR-
{</section>}

{<section id="cwsspa017.global" type="s" >}
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

PRIVATE TYPE type_return RECORD
            l_pmaa001          STRING,               #交易對象編號
            l_pmaal003         STRING,               #名稱
            l_pmaal004         STRING,               #簡稱
            l_pmaa002          STRING,               #交易對象類型
            l_pmaa003          STRING,               #統一編號
            l_pmaa005          STRING,               #所屬法人
            l_pmaa090          STRING,               #客戶分類
            l_pmaa091          STRING,               #客戶價格群組
            l_pmaa291          STRING,               #客戶其他屬性一
            l_pmaa292          STRING,               #客戶其他屬性二
            l_pmaa293          STRING,               #客戶其他屬性三
            l_pmaa294          STRING,               #客戶其他屬性四
            l_pmaa295          STRING,               #客戶其他屬性五
            l_pmaa296          STRING,               #客戶其他屬性六
            l_pmaa297          STRING,               #客戶其他屬性七
            l_pmaa298          STRING,               #客戶其他屬性八
            l_pmaa299          STRING,               #客戶其他屬性九
            l_pmaa300          STRING                #客戶其他屬性十
   END RECORD

#toptst-c260416-001 add by sjhong-end

#end add-point

{</section>}

{<section id="cwsspa017.main" type="s" >}
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
      CALL cwsspa017_process()
   END IF

   #呼叫服務後置處理程序
   CALL awsp900_01_postprocess()

   #離開作業
   CALL cl_wss_exit()

END MAIN

{</section>}

{<section id="cwsspa017.process" type="s" >}
#+ 實際處理服務程式邏輯的FUNCTION內容
PRIVATE FUNCTION cwsspa017_process() RETURNS ()   #200213-00032
   #add-point: 服務邏輯主要處理段的ADP name="cwsspa017.process"

#toptst-c260416-001 add by sjhong-start

   DEFINE l_success    LIKE type_t.num5
   DEFINE l_ent        LIKE pmaa_t.pmaaent         #集團編號
   DEFINE l_lang       LIKE imaal_t.imaal002        #語系
   DEFINE l_json_obj   util.JSONObject              #API參數obj
   DEFINE l_sql        STRING                       #SQL狀態碼
   DEFINE l_str        STRING                       #訊息
   DEFINE l_msg_parameter RECORD
            l_pmaa001          STRING,               #交易對象編號
            l_pmaal003         STRING,               #名稱
            l_pmaal004         STRING,               #簡稱
            l_pmaa002          STRING,               #交易對象類型
            l_pmaa003          STRING,               #統一編號
            l_pmaa005          STRING,               #所屬法人
            l_pmaa090          STRING,               #客戶分類
            l_pmaa091          STRING,               #客戶價格群組
            l_pmaa291          STRING,               #客戶其他屬性一
            l_pmaa292          STRING,               #客戶其他屬性二
            l_pmaa293          STRING,               #客戶其他屬性三
            l_pmaa294          STRING,               #客戶其他屬性四
            l_pmaa295          STRING,               #客戶其他屬性五
            l_pmaa296          STRING,               #客戶其他屬性六
            l_pmaa297          STRING,               #客戶其他屬性七
            l_pmaa298          STRING,               #客戶其他屬性八
            l_pmaa299          STRING,               #客戶其他屬性九
            l_pmaa300          STRING,               #客戶其他屬性十
            messages           STRING
   END RECORD

   DEFINE lr_i         INTEGER
   DEFINE rec type_return

   #返回master
   DEFINE lr_return    RECORD
            master    DYNAMIC ARRAY OF type_return
   END RECORD

   DEFINE l_msg_count  LIKE type_t.num5

   #接收傳入參數
   LET l_ent = cl_aws_json_getValue("datakey","EntId")

   IF cl_null(l_ent) THEN
      LET g_status.code = "-1"
      LET l_str = cl_replace_err_msg(cl_getmsg('wss-00138',g_dlang),'l_ent')
      LET g_status.description = l_str
      RETURN
   END IF

   LET l_sql = " SELECT pm.PMAA001, pml.PMAAL003, pml.PMAAL004, pm.PMAA002, " ,
               "        pm.PMAA003, pm.PMAA005, pm.PMAA090, pm.PMAA091, " ,
               "        pm.PMAA291, pm.PMAA292, pm.PMAA293, pm.PMAA294, " ,
               "        pm.PMAA295, pm.PMAA296, pm.PMAA297, pm.PMAA298, " ,
               "        pm.PMAA299, pm.PMAA300 " ,
               " FROM pmaa_t pm " ,
               " LEFT JOIN pmaal_t pml " ,
               "    ON pml.pmaalent = pm.pmaaent " ,
               "   AND pml.pmaal001 = pm.pmaa001 " ,
               "   AND pml.pmaal002 = 'zh_TW' " ,
               " WHERE pm.pmaa002  <> '1' " ,
               " AND pm.pmaaent   = '",l_ent,"' "

   PREPARE cwsspa_new_pb FROM l_sql
   DECLARE cwsspa_new_cs CURSOR FOR cwsspa_new_pb

   LET lr_i = 1
   INITIALIZE lr_return TO NULL

   FOREACH cwsspa_new_cs INTO rec.*

      IF SQLCA.SQLCODE THEN
         INITIALIZE g_errparam TO NULL
         LET g_status.code = SQLCA.SQLCODE
         LET l_msg_parameter.messages = cl_getmsg(g_status.code,g_lang)
         CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(l_msg_parameter))
         EXIT FOREACH
      END IF

      LET lr_return.master[lr_i].l_pmaa001  = rec.l_pmaa001
      LET lr_return.master[lr_i].l_pmaal003 = rec.l_pmaal003
      LET lr_return.master[lr_i].l_pmaal004 = rec.l_pmaal004
      LET lr_return.master[lr_i].l_pmaa002  = rec.l_pmaa002
      LET lr_return.master[lr_i].l_pmaa003  = rec.l_pmaa003
      LET lr_return.master[lr_i].l_pmaa005  = rec.l_pmaa005
      LET lr_return.master[lr_i].l_pmaa090  = rec.l_pmaa090
      LET lr_return.master[lr_i].l_pmaa091  = rec.l_pmaa091
      LET lr_return.master[lr_i].l_pmaa291  = rec.l_pmaa291
      LET lr_return.master[lr_i].l_pmaa292  = rec.l_pmaa292
      LET lr_return.master[lr_i].l_pmaa293  = rec.l_pmaa293
      LET lr_return.master[lr_i].l_pmaa294  = rec.l_pmaa294
      LET lr_return.master[lr_i].l_pmaa295  = rec.l_pmaa295
      LET lr_return.master[lr_i].l_pmaa296  = rec.l_pmaa296
      LET lr_return.master[lr_i].l_pmaa297  = rec.l_pmaa297
      LET lr_return.master[lr_i].l_pmaa298  = rec.l_pmaa298
      LET lr_return.master[lr_i].l_pmaa299  = rec.l_pmaa299
      LET lr_return.master[lr_i].l_pmaa300  = rec.l_pmaa300
      LET lr_i = lr_i + 1

   END FOREACH

   CALL cl_aws_json_addParam(util.JSONObject.FROMFGL(lr_return))

#toptst-c260416-001 add by sjhong-end

   #end add-point
END FUNCTION

{</section>}

{<section id="cwsspa017.other_function" readonly="Y" type="s" >}
#add-point:自定義元件(Function) name="other.function"

#end add-point

{</section>}
