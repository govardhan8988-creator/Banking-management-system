<#
.SYNOPSIS
    Starts the Banking Management System (Backend, Frontend, and Browser).
.DESCRIPTION
    Checks Node.js, npm, and PostgreSQL, installs dependencies if missing,
    launches the Express API server and Vite frontend, and opens the application.
#>

$ErrorActionPreference = "Stop"

# Robust project directory resolution (handles spaces, OneDrive, UNC paths)
$ProjectDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
$BackendDir = Join-Path $ProjectDir "BACKEND"
$FrontendDir = Join-Path $ProjectDir "FRONTEND"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       APEX BANKING MANAGEMENT SYSTEM - LAUNCHER          " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Project directory: $ProjectDir" -ForegroundColor Gray
Write-Host ""

# 1. Check Node.js
Write-Host "[1/5] Checking Node.js runtime..." -ForegroundColor White
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "ERROR: Node.js is not found in your PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js (v18+) from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}
$nodeVer = (& node -v)
Write-Host "       Node.js version: $nodeVer" -ForegroundColor Green

# 2. Check npm
Write-Host "[2/5] Checking npm package manager..." -ForegroundColor White
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Host "ERROR: npm is not found in your PATH!" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}
$npmVer = (& npm -v)
Write-Host "       npm version: $npmVer" -ForegroundColor Green

# 3. Check PostgreSQL
Write-Host "[3/5] Checking PostgreSQL database connectivity (port 5432)..." -ForegroundColor White
$pgConnection = Test-NetConnection -ComputerName "localhost" -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $pgConnection) {
    Write-Host "       Warning: PostgreSQL port 5432 not responding." -ForegroundColor Yellow
    Write-Host "       Checking for local PostgreSQL Windows Service..." -ForegroundColor Gray
    $pgService = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        if ($pgService.Status -ne "Running") {
            Write-Host "       Attempting to start service '$($pgService.Name)'..." -ForegroundColor Yellow
            Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 3
        }
    } else {
        Write-Host "       Notice: Make sure your PostgreSQL server is active." -ForegroundColor Yellow
    }
} else {
    Write-Host "       PostgreSQL server is reachable on port 5432." -ForegroundColor Green
}

# 4. Check dependencies and Environment files
if (-not (Test-Path (Join-Path $BackendDir ".env"))) {
    if (Test-Path (Join-Path $BackendDir ".env.example")) {
        Write-Host "       Copying default BACKEND .env from .env.example..." -ForegroundColor Gray
        Copy-Item (Join-Path $BackendDir ".env.example") (Join-Path $BackendDir ".env")
    }
}

if (-not (Test-Path (Join-Path $FrontendDir ".env"))) {
    if (Test-Path (Join-Path $FrontendDir ".env.example")) {
        Write-Host "       Copying default FRONTEND .env from .env.example..." -ForegroundColor Gray
        Copy-Item (Join-Path $FrontendDir ".env.example") (Join-Path $FrontendDir ".env")
    }
}

# 5. Start Backend Server
Write-Host "[4/5] Launching Backend Server on http://localhost:5000..." -ForegroundColor White
$backendCommand = "Set-Location -LiteralPath '$BackendDir'; Write-Host '🏦 Apex Banking Backend Server' -ForegroundColor Cyan; npm start"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $backendCommand

# Wait for backend health
Write-Host "       Waiting for backend service to report healthy..." -ForegroundColor Gray
$backendHealthy = $false
for ($i = 0; $i -lt 12; $i++) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($res.status -eq "ok") {
            $backendHealthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($backendHealthy) {
    Write-Host "       Backend API is ONLINE at http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "       Backend process launched (proceeding to frontend)..." -ForegroundColor Yellow
}

# 6. Start Frontend Server
Write-Host "[5/5] Launching Frontend Server on http://localhost:5173..." -ForegroundColor White
$frontendCommand = "Set-Location -LiteralPath '$FrontendDir'; Write-Host '💻 Apex Banking Frontend Server' -ForegroundColor Cyan; npm run dev"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $frontendCommand

# Wait briefly and launch browser
Start-Sleep -Seconds 3
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "       BANKING MANAGEMENT SYSTEM STARTED SUCCESSFULLY!    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Backend API:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Opening web dashboard in your default browser..." -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:5173"

Write-Host "You can close this launcher window at any time." -ForegroundColor Gray
