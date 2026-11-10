param([string]$Destination)
$ErrorActionPreference='Stop'
$node=(Get-Command node -ErrorAction Stop).Source
if($Destination){ & $node (Join-Path $PSScriptRoot 'scripts\install.mjs') --dest $Destination }
else { & $node (Join-Path $PSScriptRoot 'scripts\install.mjs') }
if($LASTEXITCODE -ne 0){throw 'Installation failed. Please read the error above.'}
