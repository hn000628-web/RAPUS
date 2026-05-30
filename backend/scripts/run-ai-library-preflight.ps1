$ErrorActionPreference = 'Stop'

$backendRoot = Split-Path -Parent $PSScriptRoot
Set-Location $backendRoot

Write-Host '[INFO] Running AI Library preflight checklist...'
npx ts-node src/init/check-ai-library-preflight.ts

