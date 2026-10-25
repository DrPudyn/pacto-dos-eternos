$ErrorActionPreference='Stop'
try {
 Set-DnsClientServerAddress -InterfaceIndex 20 -ServerAddresses @('8.8.8.8','8.8.4.4','2001:4860:4860::8888','2001:4860:4860::8844')
 Clear-DnsClientCache
 'OK' | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'dns-correcao-resultado.txt')
} catch { $_.Exception.Message | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'dns-correcao-resultado.txt'); exit 1 }
