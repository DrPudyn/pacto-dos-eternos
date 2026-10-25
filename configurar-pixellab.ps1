Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Security
$ErrorActionPreference='Stop'
$statusPath=Join-Path $PSScriptRoot '.pixellab-status.json'
$form=New-Object Windows.Forms.Form
$form.Text='Mini Hero — conectar PixelLab'
$form.Size=New-Object Drawing.Size(510,255)
$form.StartPosition='CenterScreen'
$form.FormBorderStyle='FixedDialog'
$form.MaximizeBox=$false
$form.TopMost=$true
$label=New-Object Windows.Forms.Label
$label.Text='Cole sua API key do PixelLab abaixo. A chave fica criptografada no seu Windows, fora da pasta do jogo e do OneDrive.'
$label.SetBounds(20,15,455,50)
$inputKey=New-Object Windows.Forms.TextBox
$inputKey.UseSystemPasswordChar=$true
$inputKey.SetBounds(20,75,455,28)
$button=New-Object Windows.Forms.Button
$button.Text='Salvar e verificar conexão'
$button.SetBounds(20,120,245,35)
$notice=New-Object Windows.Forms.Label
$notice.Text='Esta operação consulta o saldo. Não gera arte nem consome créditos de geração.'
$notice.SetBounds(20,170,455,40)
$button.Add_Click({
 $token=$inputKey.Text.Trim()
 if($token.Length -lt 10){[Windows.Forms.MessageBox]::Show('Cole a API key completa.','PixelLab');return}
 $button.Enabled=$false
 $notice.Text='Verificando conexão…'
 $form.Refresh()
 try{
  $stage='storage'
  $secretDir=Join-Path $env:LOCALAPPDATA 'MiniHero'
  [IO.Directory]::CreateDirectory($secretDir)|Out-Null
  $stage='encrypt'
  $clear=[Text.Encoding]::UTF8.GetBytes($token)
  try{$encrypted=[Security.Cryptography.ProtectedData]::Protect($clear,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)}finally{[Array]::Clear($clear,0,$clear.Length)}
  $stage='save'
  [IO.File]::WriteAllBytes((Join-Path $secretDir 'pixellab.key'),$encrypted)
  $stage='request'
  [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
  $headers=@{Authorization='Bearer '+$token}
  $response=Invoke-RestMethod -Uri 'https://api.pixellab.ai/v2/balance' -Headers $headers -Method Get -TimeoutSec 30
  $safe=[ordered]@{connected=$true;checkedAt=[DateTime]::UtcNow.ToString('o');balanceFields=@{}}
  foreach($property in $response.PSObject.Properties){if($property.Name -match 'balance|credit|remaining|usd' -and $property.Value -is [ValueType]){$safe.balanceFields[$property.Name]=$property.Value}}
  $safe|ConvertTo-Json -Depth 4|Set-Content -LiteralPath $statusPath -Encoding UTF8
  $inputKey.Text=''
  $notice.Text='Conectado! Chave salva de forma criptografada. Pode voltar à conversa.'
  $button.Text='Conexão verificada'
 }catch{
  $code=$null
  if($_.Exception.Response){$code=[int]$_.Exception.Response.StatusCode}
  @{connected=$false;stage=$stage;errorType=$_.Exception.GetType().FullName;httpStatus=$code;checkedAt=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json|Set-Content -LiteralPath $statusPath -Encoding UTF8
  $notice.Text='Não foi possível verificar. Confira a chave e a conexão e tente novamente.'
  $button.Enabled=$true
 }finally{
  if($headers){$headers.Clear()}
  $token=$null
 }
})
$form.Controls.AddRange(@($label,$inputKey,$button,$notice))
$form.AcceptButton=$button
$form.Add_Shown({$inputKey.Focus()})
[void]$form.ShowDialog()
