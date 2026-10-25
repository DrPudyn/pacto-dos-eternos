$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$stage='storage'
$headers=@{}
$pointer=[IntPtr]::Zero
try {
 $file=Join-Path (Join-Path $env:LOCALAPPDATA 'MiniHero') 'pixellab.key'
 if(-not (Test-Path -LiteralPath $file)){throw 'MissingCredential'}
 $stage='decrypt'
 $clear=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($file),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
 $token=[Text.Encoding]::UTF8.GetString($clear)
 $stage='request'
 [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
 $headers.Authorization='Bearer '+$token
 $response=Invoke-RestMethod -Uri 'https://api.pixellab.ai/v2/balance' -Headers $headers -Method Get -TimeoutSec 25
 $safe=[ordered]@{connected=$true;balanceFields=@{}}
 function Read-BalanceFields($value,$prefix,$depth){
  if($depth -gt 4 -or $null -eq $value){return}
  foreach($property in $value.PSObject.Properties){
   $field=($prefix+'.'+$property.Name).Trim('.')
   if($property.Value -is [ValueType] -and $property.Value -isnot [bool]){$safe.balanceFields[$field]=$property.Value}
   elseif($property.Value -is [pscustomobject]){Read-BalanceFields $property.Value $field ($depth+1)}
  }
 }
 Read-BalanceFields $response '' 0
 $safe|ConvertTo-Json -Depth 4
}catch{
 $http=$null;$network=$null
 if($_.Exception.Response){$http=[int]$_.Exception.Response.StatusCode}
 if($_.Exception -is [Net.WebException]){$network=$_.Exception.Status.ToString()}
 @{connected=$false;stage=$stage;errorType=$_.Exception.GetType().FullName;httpStatus=$http;networkStatus=$network}|ConvertTo-Json
}finally{
 $headers.Clear();$token=$null
 if($clear){[Array]::Clear($clear,0,$clear.Length)}
}
