@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"

set LOG_FILE=切結沖銷排程執行紀錄.log

:: 取得時間戳記
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set DPART=%%a/%%b/%%c
for /f "tokens=1-2 delims= " %%a in ('echo %time%') do set TPART=%%a
set TIMESTAMP=%DPART% %TPART%

echo [%TIMESTAMP%] ========== 切結沖銷排程開始執行 ==========
echo [%TIMESTAMP%] ========== 切結沖銷排程開始執行 ========== >> "%LOG_FILE%"

:: Step 1: 切結明細
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set DPART=%%a/%%b/%%c
for /f "tokens=1-2 delims= " %%a in ('echo %time%') do set TPART=%%a
set TIMESTAMP=%DPART% %TPART%

echo [%TIMESTAMP%] ---- 開始：切結明細 ----
echo [%TIMESTAMP%] ---- 開始：切結明細 ---- >> "%LOG_FILE%"

node GooglePledgeBillAutoDate.js
if %errorlevel% neq 0 (
    for /f "tokens=1-3 delims=/" %%a in ('date /t') do set DPART=%%a/%%b/%%c
    for /f "tokens=1-2 delims= " %%a in ('echo %time%') do set TPART=%%a
    set TIMESTAMP=%DPART% %TPART%
    echo [!TIMESTAMP!] [FAIL] 切結明細執行失敗，後續步驟中止
    echo [!TIMESTAMP!] [FAIL] 切結明細執行失敗，後續步驟中止 >> "%LOG_FILE%"
    echo [!TIMESTAMP!] ========== 排程中止 ==========
    echo [!TIMESTAMP!] ========== 排程中止 ========== >> "%LOG_FILE%"
    pause
    exit /b 1
)

for /f "tokens=1-3 delims=/" %%a in ('date /t') do set DPART=%%a/%%b/%%c
for /f "tokens=1-2 delims= " %%a in ('echo %time%') do set TPART=%%a
set TIMESTAMP=%DPART% %TPART%

echo [%TIMESTAMP%] [OK] 切結明細完成
echo [%TIMESTAMP%] [OK] 切結明細完成 >> "%LOG_FILE%"

:: Step 2: 切結轉神寶
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set DPART=%%a/%%b/%%c
for /f "tokens=1-2 delims= " %%a in ('echo %time%') do set TPART=%%a
set TIMESTAMP=%DPART% %TPART%

echo [%TIMESTAMP%] ---- 開始：切結轉神寶 ----
echo [%TIMESTAMP%] ---- 開始：切結轉神寶 ---- >> "%LOG_FILE%"

node GoogleOffsetListAutoDate.js
if %errorlevel% neq 0 (
    for /f "tokens=1-3 delims=/" %%a in ('date /t') do set DPART=%%a/%%b/%%c
    for /f "tokens=1-2 delims= " %%a in ('echo %time%') do set TPART=%%a
    set TIMESTAMP=%DPART% %TPART%
    echo [!TIMESTAMP!] [FAIL] 切結轉神寶執行失敗
    echo [!TIMESTAMP!] [FAIL] 切結轉神寶執行失敗 >> "%LOG_FILE%"
    echo [!TIMESTAMP!] ========== 排程中止 ==========
    echo [!TIMESTAMP!] ========== 排程中止 ========== >> "%LOG_FILE%"
    pause
    exit /b 1
)

for /f "tokens=1-3 delims=/" %%a in ('date /t') do set DPART=%%a/%%b/%%c
for /f "tokens=1-2 delims= " %%a in ('echo %time%') do set TPART=%%a
set TIMESTAMP=%DPART% %TPART%

echo [%TIMESTAMP%] [OK] 切結轉神寶完成
echo [%TIMESTAMP%] [OK] 切結轉神寶完成 >> "%LOG_FILE%"

echo [%TIMESTAMP%] ========== 切結沖銷排程全部完成 ==========
echo [%TIMESTAMP%] ========== 切結沖銷排程全部完成 ========== >> "%LOG_FILE%"
pause
