# ============================================================
#  Sheltrr Windows Deployment Script - Part 2 of 2
#  FMC Technologies
#  Run this after rebooting from Part 1.
#  Docker Desktop must be running before starting.
# ============================================================

# Require admin
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: Please run this script as Administrator." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Sheltrr Windows Deployment - Part 2 of 2" -ForegroundColor Cyan
Write-Host "   FMC Technologies" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# ── CHECK DOCKER IS RUNNING ───────────────────────────────────────────────────
Write-Host "Checking Docker Desktop is running..." -ForegroundColor Yellow
$dockerRunning = $false
$attempts = 0
while (-not $dockerRunning -and $attempts -lt 30) {
    try {
        docker ps 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
    } catch {}
    if (-not $dockerRunning) {
        Write-Host "Waiting for Docker Desktop to start... ($attempts/30)" -ForegroundColor Gray
        Start-Sleep -Seconds 10
        $attempts++
    }
}

if (-not $dockerRunning) {
    Write-Host "ERROR: Docker Desktop is not running." -ForegroundColor Red
    Write-Host "Please open Docker Desktop from the Start menu and wait for it to fully start, then re-run this script." -ForegroundColor Yellow
    exit 1
}
Write-Host "Docker Desktop is running." -ForegroundColor Green

# ── RETRIEVE TAILSCALE KEY ────────────────────────────────────────────────────
$keyFile = "$env:TEMP\sheltrr_ts_key.txt"
if (Test-Path $keyFile) {
    $TAILSCALE_KEY = Get-Content $keyFile -Raw
    $TAILSCALE_KEY = $TAILSCALE_KEY.Trim()
    Write-Host "Tailscale key retrieved from Part 1." -ForegroundColor Green
} else {
    $TAILSCALE_KEY = Read-Host "Enter your Tailscale auth key"
}

# ── AUTO-DETECT SERVER IP ─────────────────────────────────────────────────────
$SERVER_IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
Write-Host "Detected server IP: $SERVER_IP" -ForegroundColor Green

# ── CONNECT TAILSCALE ─────────────────────────────────────────────────────────
Write-Host "[1/6] Connecting Tailscale..." -ForegroundColor Yellow
tailscale up --authkey="$TAILSCALE_KEY" --hostname="sheltrr-yonkers"
$TAILSCALE_IP = tailscale ip -4
Write-Host "Tailscale connected. IP: $TAILSCALE_IP" -ForegroundColor Green

# ── CLONE REPO ────────────────────────────────────────────────────────────────
Write-Host "[2/6] Cloning Sheltrr repository..." -ForegroundColor Yellow
if (Test-Path "C:\Sheltrr") {
    Write-Host "C:\Sheltrr already exists. Pulling latest changes..." -ForegroundColor Yellow
    Set-Location "C:\Sheltrr"
    git pull
} else {
    git clone https://github.com/cprichin/sheltrr.git C:\Sheltrr
    Set-Location "C:\Sheltrr"
}
Write-Host "Repository ready." -ForegroundColor Green

# ── CONFIGURE SERVER IP ───────────────────────────────────────────────────────
Write-Host "[3/6] Configuring server IP: $SERVER_IP" -ForegroundColor Yellow

# Update dashboard env
@"
REACT_APP_API_URL=http://${SERVER_IP}:8000/api
"@ | Out-File -FilePath "C:\Sheltrr\dashboard\.env.production" -Encoding utf8 -NoNewline

# PWA uses dynamic hostname
Write-Host "PWA config uses dynamic hostname - no changes needed." -ForegroundColor Green

# Write .env file
@"
ADMIN_PASSWORD=Sheltrr2026
"@ | Out-File -FilePath "C:\Sheltrr\.env" -Encoding utf8 -NoNewline
Write-Host "Environment config written." -ForegroundColor Green

# ── CONFIGURE RCLONE FOR GOOGLE DRIVE ─────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Google Drive Setup" -ForegroundColor Cyan
Write-Host "   Authorize rclone with the shelter's Google" -ForegroundColor Cyan
Write-Host "   account when prompted." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
rclone config

# Copy rclone config to backup folder
if (!(Test-Path "C:\Sheltrr\backup")) { New-Item -ItemType Directory -Path "C:\Sheltrr\backup" }
$rcloneConfig = "$env:APPDATA\rclone\rclone.conf"
if (Test-Path $rcloneConfig) {
    Copy-Item $rcloneConfig "C:\Sheltrr\backup\rclone.conf"
    Write-Host "rclone config copied to backup folder." -ForegroundColor Green
} else {
    Write-Host "WARNING: rclone config not found. You may need to copy it manually to C:\Sheltrr\backup\rclone.conf" -ForegroundColor Yellow
}

# ── ADD SUDOERS EQUIVALENT (Windows - skip, not needed) ───────────────────────
# On Windows, Tailscale commands run via the Tailscale service which handles permissions

# ── BUILD AND START DOCKER CONTAINERS ─────────────────────────────────────────
Write-Host "[4/6] Building and starting Docker containers..." -ForegroundColor Yellow
Set-Location "C:\Sheltrr"
docker-compose -f docker-compose.windows.yml up -d --build
Write-Host "Docker containers started." -ForegroundColor Green

# ── VERIFY CONTAINERS ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/6] Verifying containers..." -ForegroundColor Yellow
docker ps

# ── TEST BACKUP ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[6/6] Testing backup..." -ForegroundColor Yellow
docker exec sheltrr-backup /app/backup.sh
Write-Host "Backup test complete." -ForegroundColor Green

# ── AUTO-START ON BOOT (Task Scheduler) ──────────────────────────────────────
Write-Host "Configuring auto-start on boot via Task Scheduler..." -ForegroundColor Yellow

$action = New-ScheduledTaskAction -Execute "docker-compose" -Argument "up -d" -WorkingDirectory "C:\Sheltrr"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName "Sheltrr" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
Write-Host "Auto-start on boot configured." -ForegroundColor Green

# Clean up temp key file
if (Test-Path $keyFile) { Remove-Item $keyFile }

# This block should be inserted BEFORE the "# ── DONE ──" section in deploy-windows-part2.ps1 
# ── INSTALL AND START HOST AGENT ───────────────────────────────────────────── 
Write-Host "Installing Sheltrr Host Agent..." -ForegroundColor Yellow 

 # Copy agent to install location 
Copy-Item "C:\Sheltrr\agent.py" "C:\Sheltrr\agent.py" -Force 

 # Register as startup task"

 $agentAction = New-ScheduledTaskAction `     -Execute "python" `     -Argument "C:\Sheltrr\agent.py" `     -WorkingDirectory "C:\Sheltrr" 

$agentTrigger = New-ScheduledTaskTrigger -AtStartup

 $agentPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest $agentSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)  Register-ScheduledTask -TaskName "SheltrAgent" -Action $agentAction -Trigger $agentTrigger -Principal $agentPrincipal -Settings $agentSettings -Force  # Start it now Start-ScheduledTask -TaskName "SheltrAgent" Write-Host "Host Agent installed and started." -ForegroundColor Green

# ── DONE ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Deployment complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dashboard:     http://$SERVER_IP" -ForegroundColor White
Write-Host "API:           http://${SERVER_IP}:8000" -ForegroundColor White
Write-Host "API Docs:      http://${SERVER_IP}:8000/docs" -ForegroundColor White
Write-Host "Scanner PWA:   http://$SERVER_IP/pwa/index.html" -ForegroundColor White
Write-Host "Setup Page:    http://$SERVER_IP/pwa/setup.html" -ForegroundColor White
Write-Host "Admin Panel:   http://$SERVER_IP/pwa/admin.html" -ForegroundColor White
Write-Host "Tailscale IP:  $TAILSCALE_IP" -ForegroundColor White
Write-Host ""
Write-Host "Remote access: ssh $env:USERNAME@$TAILSCALE_IP" -ForegroundColor White
Write-Host "Push updates:  docker-compose pull && docker-compose up -d --build" -ForegroundColor White
Write-Host ""
Write-Host "Admin panel password: Sheltrr2026" -ForegroundColor Yellow
Write-Host "Backup runs nightly at 2:00 AM." -ForegroundColor White
Write-Host "To run manually: docker exec sheltrr-backup /app/backup.sh" -ForegroundColor White
Write-Host ""
