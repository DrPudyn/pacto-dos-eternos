@echo off
cd /d "%~dp0"
powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'minihero-offline\servidor.cjs' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput 'minihero-offline\servidor.log' -RedirectStandardError 'minihero-offline\servidor-erro.log'"
start "" "http://127.0.0.1:17840"
