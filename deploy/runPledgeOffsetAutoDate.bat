@echo off
setlocal enabledelayedexpansion
chcp 950 >nul
cd /d "%~dp0"

set "LOG_FILE=PledgeOffsetAutoDate.log"

:: 取得時間戳記
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy/MM/dd HH:mm:ss\""') do set "TS=%%i"

echo [%TS%] ========== 切結沖銷排程開始執行 ==========
echo [%TS%] ========== 切結沖銷排程開始執行 ========== >> "%LOG_FILE%"

:: Step 1: 切結明細
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy/MM/dd HH:mm:ss\""') do set "TS=%%i"
echo [%TS%] ---- 開始：切結明細 ----
echo [%TS%] ---- 開始：切結明細 ---- >> "%LOG_FILE%"

call node GooglePledgeBillAutoDate.js
if !errorlevel! neq 0 (
    for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy/MM/dd HH:mm:ss\""') do set "TS=%%i"
    echo [!TS!] [FAIL] 切結明細執行失敗，後續步驟中止
    echo [!TS!] [FAIL] 切結明細執行失敗，後續步驟中止 >> "%LOG_FILE%"
    echo [!TS!] ========== 排程中止 ==========
    echo [!TS!] ========== 排程中止 ========== >> "%LOG_FILE%"
    pause
    exit /b 1
)

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy/MM/dd HH:mm:ss\""') do set "TS=%%i"
echo [%TS%] [OK] 切結明細完成
echo [%TS%] [OK] 切結明細完成 >> "%LOG_FILE%"

:: Step 2: 切結轉神寶
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy/MM/dd HH:mm:ss\""') do set "TS=%%i"
echo [%TS%] ---- 開始：切結轉神寶 ----
echo [%TS%] ---- 開始：切結轉神寶 ---- >> "%LOG_FILE%"

call node GoogleOffsetListAutoDate.js
if !errorlevel! neq 0 (
    for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy/MM/dd HH:mm:ss\""') do set "TS=%%i"
    echo [!TS!] [FAIL] 切結轉神寶執行失敗
    echo [!TS!] [FAIL] 切結轉神寶執行失敗 >> "%LOG_FILE%"
    echo [!TS!] ========== 排程中止 ==========
    echo [!TS!] ========== 排程中止 ========== >> "%LOG_FILE%"
    pause
    exit /b 1
)

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy/MM/dd HH:mm:ss\""') do set "TS=%%i"
echo [%TS%] [OK] 切結轉神寶完成
echo [%TS%] [OK] 切結轉神寶完成 >> "%LOG_FILE%"

echo [%TS%] ========== 切結沖銷排程全部完成 ==========
echo [%TS%] ========== 切結沖銷排程全部完成 ========== >> "%LOG_FILE%"
pause
