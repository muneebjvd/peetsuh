@echo off
title Peetsuh Server Launcher
color 0c

echo ==================================================
echo.
echo      peetsuh - Pizza Worth Talking About
echo.
echo ==================================================
echo.

:: Ensure we are running in the script's directory
cd /d "%~dp0"

:: Check if node_modules exists, run npm install if missing
IF NOT EXIST "node_modules" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
)

echo [INFO] Starting the local development server...
echo [INFO] Your browser will automatically open in a few seconds.
echo.
echo Press Ctrl+C in this window to stop the server at any time.
echo.

:: Wait for about 5 seconds before opening the browser
start /b cmd /c "ping localhost -n 6 > nul && start http://localhost:3000"

:: Start the Next.js dev server
call npm run dev

pause
