@echo off
title JARVIS
cd /d %~dp0
where node >nul 2>nul || (echo Node.js is not installed. Get it from https://nodejs.org ^(LTS^) and run this again. & pause & exit /b)
if not exist node_modules (echo Installing... & call npm install)
if not exist .env (copy .env.example .env >nul & echo Created .env - add your keys, then run this again. & notepad .env & exit /b)
start "JARVIS server" /min cmd /k "node server.js"
timeout /t 3 /nobreak >nul
set URL=http://localhost:7777
set CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe
if exist "%CHROME%" (start "" "%CHROME%" --app=%URL% --start-fullscreen) else (start "" msedge --app=%URL% --start-fullscreen)
