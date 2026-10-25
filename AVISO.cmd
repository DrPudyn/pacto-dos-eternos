@echo off
cd /d "%~dp0"
echo.
echo ============================================
echo  AVISO PARA TODOS OS JOGADORES
echo ============================================
echo.
echo Digite a mensagem e pressione Enter.
echo Ela aparece na tela de quem esta jogando
echo e de quem entrar nos proximos 10 minutos.
echo Cada jogador ve o aviso uma unica vez.
echo.
powershell -NoProfile -Command "$t = Read-Host 'Mensagem'; if ([string]::IsNullOrWhiteSpace($t)) { Write-Host 'Nenhuma mensagem. Nada foi enviado.'; exit 1 }; & node .\avisar.cjs $t; exit $LASTEXITCODE"
echo.
pause
