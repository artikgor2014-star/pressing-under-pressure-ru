@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запускаю локальный сервер и открываю игру...
start "" http://localhost:8765/
where python >nul 2>nul && (python -m http.server 8765 & goto :eof)
where py >nul 2>nul && (py -m http.server 8765 & goto :eof)
where node >nul 2>nul && (npx --yes serve -l 8765 . & goto :eof)
echo Нужен Python или Node.js — без локального сервера браузер не загрузит игру.
pause
