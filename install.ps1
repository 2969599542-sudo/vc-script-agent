param([string]$Destination)
$ErrorActionPreference='Stop'
$node=(Get-Command node -ErrorAction Stop).Source
if($Destination){ & $node (Join-Path $PSScriptRoot 'scripts\install.mjs') --dest $Destination }
else { & $node (Join-Path $PSScriptRoot 'scripts\install.mjs') }
if($LASTEXITCODE -ne 0){throw '安装未完成，请查看上方错误。'}
