# ============================================================
#  Sheltrr Windows Deployment Script - Part 1 of 2
#  FMC Technologies
#  Run this script first. A reboot is required after.
#  After rebooting, run deploy-windows-part2.ps1
# ============================================================

# Require admin
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: Please run this script as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Sheltrr Windows Deployment - Part 1 of 2" -ForegroundColor Cyan
Write-Host "   FMC Technologies" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── COLLECT TAILSCALE KEY ─────────────────────────────────────────────────────
$TAILSCALE_KEY = Read-Host "Enter your Tailscale auth key"
Write-Host ""

# Save key for Part 2
$keyFile = "$env:TEMP\sheltrr_ts_key.txt"
$TAILSCALE_KEY | Out-File -FilePath $keyFile -Encoding utf8
Write-Host "Tailscale key saved for Part 2." -ForegroundColor Green

# ── INSTALL CHOCOLATEY (Windows package manager) ──────────────────────────────
Write-Host "[1/5] Installing Chocolatey package manager..." -ForegroundColor Yellow
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "Chocolatey installed." -ForegroundColor Green
} else {
    Write-Host "Chocolatey already installed." -ForegroundColor Green
}

# Refresh environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# ── INSTALL GIT ───────────────────────────────────────────────────────────────
Write-Host "[2/5] Installing Git..." -ForegroundColor Yellow
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    choco install git -y
    Write-Host "Git installed." -ForegroundColor Green
} else {
    Write-Host "Git already installed." -ForegroundColor Green
}

# ── INSTALL DOCKER DESKTOP ────────────────────────────────────────────────────
Write-Host "[3/5] Installing Docker Desktop..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    choco install docker-desktop -y
    Write-Host "Docker Desktop installed." -ForegroundColor Green
} else {
    Write-Host "Docker Desktop already installed." -ForegroundColor Green
}

# ── INSTALL TAILSCALE ─────────────────────────────────────────────────────────
Write-Host "[4/5] Installing Tailscale..." -ForegroundColor Yellow
if (!(Get-Command tailscale -ErrorAction SilentlyContinue)) {
    choco install tailscale -y
    Write-Host "Tailscale installed." -ForegroundColor Green
} else {
    Write-Host "Tailscale already installed." -ForegroundColor Green
}

# ── INSTALL RCLONE ────────────────────────────────────────────────────────────
Write-Host "[5/5] Installing rclone..." -ForegroundColor Yellow
if (!(Get-Command rclone -ErrorAction SilentlyContinue)) {
    choco install rclone -y
    Write-Host "rclone installed." -ForegroundColor Green
} else {
    Write-Host "rclone already installed." -ForegroundColor Green
}

# ── DONE ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Part 1 complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: You must reboot now for Docker Desktop to finish installing." -ForegroundColor Yellow
Write-Host ""
Write-Host "After rebooting:" -ForegroundColor White
Write-Host "  1. Wait for Docker Desktop to start (whale icon in system tray)" -ForegroundColor White
Write-Host "  2. Open PowerShell as Administrator" -ForegroundColor White
Write-Host "  3. Run: .\deploy-windows-part2.ps1" -ForegroundColor White
Write-Host ""

$reboot = Read-Host "Reboot now? (y/n)"
if ($reboot -eq "y") {
    Restart-Computer -Force
}
