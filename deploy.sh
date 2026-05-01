#!/bin/bash

set -e

echo "================================================"
echo "   Sheltrr Automated Deployment"
echo "   FMC Technologies"
echo "================================================"
echo ""

# ── COLLECT INPUTS ────────────────────────────────────────────────────────────
read -p "Enter your Tailscale auth key: " TAILSCALE_KEY
echo ""

# ── AUTO-DETECT SERVER IP ─────────────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Detected server IP: $SERVER_IP"
echo ""

# ── SYSTEM UPDATE ─────────────────────────────────────────────────────────────
echo "[1/9] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ── BASE DEPENDENCIES ─────────────────────────────────────────────────────────
echo "[2/9] Installing base dependencies..."
sudo apt install -y git curl unzip python3 python3-pip python3-venv dos2unix ca-certificates gnupg openssh-server

# Enable SSH
sudo systemctl enable ssh
sudo systemctl start ssh
echo "SSH server enabled"

# ── NODE.JS 24 LTS ────────────────────────────────────────────────────────────
echo "[3/9] Installing Node.js 24 LTS..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install -y nodejs
echo "Node.js $(node --version) installed"

# ── DOCKER ────────────────────────────────────────────────────────────────────
echo "[4/9] Installing Docker..."
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER

# ── DOCKER COMPOSE ────────────────────────────────────────────────────────────
echo "[5/9] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
echo "Docker Compose $(docker-compose --version) installed"

# ── RCLONE ────────────────────────────────────────────────────────────────────
echo "[6/9] Installing rclone..."
curl https://rclone.org/install.sh | sudo bash

# ── TAILSCALE ─────────────────────────────────────────────────────────────────
echo "[7/9] Installing and connecting Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey="$TAILSCALE_KEY" --hostname="sheltrr-yonkers"
TAILSCALE_IP=$(tailscale ip -4)
echo "Tailscale connected. IP: $TAILSCALE_IP"

# ── CLONE REPO ────────────────────────────────────────────────────────────────
echo "[8/9] Cloning Sheltrr repository..."
git clone https://github.com/cprichin/sheltrr.git /opt/sheltrr
sudo chown -R $USER /opt/sheltrr
cd /opt/sheltrr

# ── CONFIGURE SERVER IP ───────────────────────────────────────────────────────
echo "Configuring server IP: $SERVER_IP"

# Update dashboard env
cat > dashboard/.env.production << EOF
REACT_APP_API_URL=http://${SERVER_IP}:8000/api
EOF

# PWA config uses dynamic hostname - no need to hardcode IP
echo "PWA config uses dynamic hostname - no changes needed"

# ── SUDOERS RULE FOR TAILSCALE API CONTROL ────────────────────────────────────
echo "Configuring sudoers for Tailscale API control..."
echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/tailscale" | sudo tee /etc/sudoers.d/sheltrr-tailscale
sudo chmod 440 /etc/sudoers.d/sheltrr-tailscale
echo "Sudoers rule added"


# ── CONFIGURE RCLONE FOR GOOGLE DRIVE ─────────────────────────────────────────
echo ""
echo "================================================"
echo "   Google Drive Setup"
echo "   Authorize rclone with the shelter's Google"
echo "   account when prompted."
echo "================================================"
echo ""
rclone config

# Copy generated rclone config to backup folder
mkdir -p /opt/sheltrr/backup
cp ~/.config/rclone/rclone.conf /opt/sheltrr/backup/rclone.conf

# Verify Tailscale socket exists
if [ ! -S /var/run/tailscale/tailscaled.sock ]; then
  echo "ERROR: Tailscale socket not found. Ensure Tailscale is running before continuing."
  exit 1
fi

# ── BUILD AND START ───────────────────────────────────────────────────────────
echo "[9/9] Building and starting Docker containers..."

# Apply Docker group without requiring logout
newgrp docker << DOCKERCMD
cd /opt/sheltrr
docker-compose up -d --build
DOCKERCMD

# ── VERIFY ────────────────────────────────────────────────────────────────────
echo ""
echo "Verifying containers..."
docker ps

# ── TEST BACKUP ───────────────────────────────────────────────────────────────
echo ""
echo "Testing backup..."
docker exec sheltrr-backup /app/backup.sh

# ── AUTO-START ON BOOT ────────────────────────────────────────────────────────
echo "Configuring auto-start on boot..."
cat > /etc/systemd/system/sheltrr.service << EOF
[Unit]
Description=Sheltrr Docker Compose
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/sheltrr
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=300
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable sheltrr.service

# ── DONE ──────────────────────────────────────────────────────────────────────
echo ""
echo "================================================"
echo "   Deployment complete!"
echo "================================================"
echo ""
echo "Dashboard:     http://${SERVER_IP}"
echo "API:           http://${SERVER_IP}:8000"
echo "API Docs:      http://${SERVER_IP}:8000/docs"
echo "Scanner PWA:   http://${SERVER_IP}/pwa/index.html"
echo "Setup Page:    http://${SERVER_IP}/pwa/setup.html"
echo "Tailscale IP:  ${TAILSCALE_IP}"
echo ""
echo "Remote access: ssh $USER@${TAILSCALE_IP}"
echo "Push updates:  ssh $USER@${TAILSCALE_IP} 'cd /opt/sheltrr && git pull && docker-compose up -d --build'"
echo ""
echo "Backup runs nightly at 2:00 AM."
echo "To run manually: docker exec sheltrr-backup /app/backup.sh"
echo ""
