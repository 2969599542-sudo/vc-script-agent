param([string]$Destination)
$ErrorActionPreference = 'Stop'

# Explorer may still have the old PATH after Node.js or Python was installed.
$env:Path += ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine') +
    ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$nodes = @(Get-Command node.exe -CommandType Application -All -ErrorAction SilentlyContinue)
$node = $nodes | Where-Object {
    $npmCli = if ($env:VC_NPM_CLI) { $env:VC_NPM_CLI }
    else { Join-Path (Split-Path -Parent $_.Source) 'node_modules\npm\bin\npm-cli.js' }
    if (Test-Path -LiteralPath $npmCli -PathType Leaf) {
        $version = & $_.Source -p 'process.versions.node'
        $LASTEXITCODE -eq 0 -and $version -match '^\d+\.\d+\.\d+$' -and [version]$version -ge [version]'22.13.0'
    }
} | Select-Object -First 1
if (-not $node) {
    Write-Host '未找到带 npm 的 Node.js 22.13 或以上版本。请先运行包内“依赖安装程序”中的 Node.js MSI，再重新双击 install.cmd。' -ForegroundColor Red
    exit 1
}

$installer = Join-Path $PSScriptRoot 'scripts\install.mjs'
if ($Destination) { & $node.Source $installer --dest $Destination }
else { & $node.Source $installer }
exit $LASTEXITCODE
