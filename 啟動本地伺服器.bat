@echo off
chcp 65001 > nul
title 基地日報本地伺服器 (Foundation Gazette Local Server)
echo ===================================================================
echo   基地日報本地伺服器啟動器 (Foundation Gazette Local Server)
echo ===================================================================
echo.
echo 說明：直接按兩下 index.html 會因為瀏覽器的本地檔案安全限制 (CORS) 
echo 導致無法將含有圖片的日報導出為圖片 (PNG)。
echo 啟動本地伺服器後，您可以透過網址瀏覽，即可完美一鍵導出！
echo.
echo 正在嘗試啟動 Python 本地伺服器...
echo -------------------------------------------------------------------
echo.
python -m http.server 8000
if %errorlevel% neq 0 (
    echo.
    echo 💡 偵測到 Python 無法執行，正在嘗試以 PowerShell 啟動本地伺服器...
    echo -------------------------------------------------------------------
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_server.ps1"
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 錯誤：無法啟動 PowerShell 伺服器。
        echo.
        pause
    )
) else (
    echo.
    echo ===================================================================
    echo 🎉 伺服器已成功啟動！
    echo 請在瀏覽器網址列輸入並前往： http://localhost:8000
    echo ===================================================================
    echo.
    pause
)
