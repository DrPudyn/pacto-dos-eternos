param([Parameter(Mandatory=$true)][string]$Route,[string]$BodyFile,[Parameter(Mandatory=$true)][string]$OutputFile)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$headers=@{};$clear=$null
try{
 if($Route -notmatch '^[a-zA-Z0-9/_-]+$'){throw 'Invalid route'}
 $keyFile=Join-Path (Join-Path $env:LOCALAPPDATA 'MiniHero') 'pixellab.key'
 $clear=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($keyFile),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
 $token=[Text.Encoding]::UTF8.GetString($clear)
 $headers.Authorization='Bearer '+$token
 [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
 $uri='https://api.pixellab.ai/v2/'+$Route
 if($BodyFile){$body=[IO.File]::ReadAllText((Resolve-Path -LiteralPath $BodyFile));$response=Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 240}
 else{$response=Invoke-RestMethod -Uri $uri -Headers $headers -Method Get -TimeoutSec 40}
 [IO.File]::WriteAllText($OutputFile,($response|ConvertTo-Json -Depth 100),[Text.UTF8Encoding]::new($false))
 Write-Output 'Resposta salva sem expor a credencial.'
 if($response.usage){$response.usage|ConvertTo-Json -Compress}
}catch{
 $code=$null;if($_.Exception.Response){$code=[int]$_.Exception.Response.StatusCode}
 @{ok=$false;httpStatus=$code;errorType=$_.Exception.GetType().FullName}|ConvertTo-Json
 exit 1
}finally{$headers.Clear();$token=$null;if($clear){[Array]::Clear($clear,0,$clear.Length)}}
