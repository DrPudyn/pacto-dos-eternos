@echo off
cd /d "%~dp0"
powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'servidor-compartilhado.cjs' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput 'compartilhado.log' -RedirectStandardError 'compartilhado-erro.log'"
start "" "http://127.0.0.1:17841"
