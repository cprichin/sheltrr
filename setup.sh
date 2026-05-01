#!/bin/bash

set -e

echo "================================================"
echo "   Sheltrr Dev Environment Setup"
echo "   FMC Technologies"
echo "================================================"
echo ""

# Update system
echo "[1/8] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install basic dependencies
echo "[2/8] Installing base dependencies..."
sudo apt install -y git curl unzip python3 python3-pip python3-venv dos2unix ca-certificates gnupg openssh-server

# Enable SSH
sudo systemctl enable ssh
sudo systemctl start ssh
echo "SSH server enabled"

# Install Node.js 24 LTS
echo "[3/8] Installing Node.js 24 LTS..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install -y nodejs
echo "Node.js $(node --version) installed"

# Install Docker
echo "[4/8] Installing Docker..."
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER

# Install Docker Compose
echo "[5/8] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
echo "Docker Compose $(docker-compose --version) installed"

# Install rclone
echo "[6/8] Installing rclone..."
curl https://rclone.org/install.sh | sudo bash

# Install Tailscale (optional)
echo ""
read -p "Install Tailscale for remote access? (y/n): " INSTALL_TS
if [ "$INSTALL_TS" = "y" ]; then
  echo "[7/8] Installing Tailscale..."
  curl -fsSL https://tailscale.com/install.sh | sh
  echo ""
  echo "Run 'sudo tailscale up' after setup to authenticate."
else
  echo "[7/8] Skipping Tailscale."
fi

# Clone repo
echo "[8/8] Cloning Sheltrr repository..."
git clone https://github.com/cprichin/sheltrr.git ~/sheltrr
cd ~/sheltrr

# Set up Python backend
echo "Setting up Python backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Install dashboard dependencies
echo "Installing dashboard dependencies..."
cd dashboard
npm install
cd ..

echo ""
echo "================================================"
echo "   Setup complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Log out and back in for Docker group changes to take effect"
echo "  2. Find your IP: ip addr show | grep 'inet '"
echo "  3. Set IP in dashboard/.env.production and dashboard/pwa/config.js"
echo "  4. Set up rclone: rclone config"
echo "  5. Copy rclone config: cp ~/.config/rclone/rclone.conf ~/sheltrr/backup/rclone.conf"
echo "  6. Build and start: cd ~/sheltrr && docker-compose up -d --build"
echo "  7. If Tailscale was installed, run: sudo tailscale up"
echo ""
