@echo off
cd /d "%~dp0"
echo Parando o servidor...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 17841 -State Listen -EA SilentlyContinue | %% { Stop-Process -Id $_.OwningProcess -Force }"
timeout /t 2 >nul
for /f %%i in ('powershell -NoProfile -Command "Get-Date -f yyyyMMdd-HHmm"') do set STAMP=%%i
echo Backup dos saves em backups-saves\%STAMP%...
robocopy dados-compartilhados "backups-saves\%STAMP%" /E /NFL /NDL /NP >nul
echo Baixando atualizacoes do GitHub...
git pull --ff-only || (echo ERRO ao baixar & pause & exit /b 1)
node preparar-offline.cjs || (echo ERRO no build & pause & exit /b 1)
start "" "ABRIR MINI HERO COMPARTILHADO.cmd"
echo Pronto! Jogo atualizado e no ar.
timeout /t 5
