@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "LOG_FILE=PledgeOffsetAutoDate.log"

for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy/MM/dd_HH:mm:ss'"`) do set "TS=%%i"
echo [%TS%] ========== PledgeOffset Start ==========
echo [%TS%] ========== PledgeOffset Start ========== >> "%LOG_FILE%"

:: Step 1: PledgeBill
for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy/MM/dd_HH:mm:ss'"`) do set "TS=%%i"
echo [%TS%] ---- Step1: PledgeBill ----
echo [%TS%] ---- Step1: PledgeBill ---- >> "%LOG_FILE%"

call node GooglePledgeBillAutoDate.js
if !errorlevel! neq 0 (
    for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy/MM/dd_HH:mm:ss'"`) do set "TS=%%i"
    echo [!TS!] [FAIL] PledgeBill failed, abort
    echo [!TS!] [FAIL] PledgeBill failed, abort >> "%LOG_FILE%"
    pause
    exit /b 1
)

for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy/MM/dd_HH:mm:ss'"`) do set "TS=%%i"
echo [%TS%] [OK] PledgeBill done
echo [%TS%] [OK] PledgeBill done >> "%LOG_FILE%"

:: Step 2: OffsetList
for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy/MM/dd_HH:mm:ss'"`) do set "TS=%%i"
echo [%TS%] ---- Step2: OffsetList ----
echo [%TS%] ---- Step2: OffsetList ---- >> "%LOG_FILE%"

call node GoogleOffsetListAutoDate.js
if !errorlevel! neq 0 (
    for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy/MM/dd_HH:mm:ss'"`) do set "TS=%%i"
    echo [!TS!] [FAIL] OffsetList failed
    echo [!TS!] [FAIL] OffsetList failed >> "%LOG_FILE%"
    pause
    exit /b 1
)

for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy/MM/dd_HH:mm:ss'"`) do set "TS=%%i"
echo [%TS%] [OK] OffsetList done
echo [%TS%] [OK] OffsetList done >> "%LOG_FILE%"

echo [%TS%] ========== PledgeOffset All Done ==========
echo [%TS%] ========== PledgeOffset All Done ========== >> "%LOG_FILE%"
pause
