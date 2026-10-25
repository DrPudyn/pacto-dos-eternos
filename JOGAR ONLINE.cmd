@echo off
cd /d "%~dp0"
start "" "ABRIR MINI HERO COMPARTILHADO.cmd"
timeout /t 5 >nul
start "ngrok" cmd /k ngrok http --url=elongated-handwrite-expose.ngrok-free.dev 17841