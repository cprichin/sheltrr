#!/bin/bash

set -e

echo "=== Sheltrr Dev Environment Setup ==="

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install basic dependencies
echo "Installing dependencies..."
sudo apt install -y git curl unzip python3 python3-pip python3-venv

# Install Node.js 18
echo "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install rclone
echo "Installing rclone..."
curl https://rclone.org/install.sh | sudo bash
# Install Tailscale (optional)
echo ""
read -p "Install Tailscale for remote access? (y/n): " INSTALL_TS
if [ "$INSTALL_TS" = "y" ]; then
  echo "Installing Tailscale..."
  curl -fsSL https://tailscale.com/install.sh | sh
  echo ""
  echo "Run 'sudo tailscale up' after setup to authenticate."
fi

# Clone repo
echo "Cloning Sheltrr repo..."
git clone https://github.com/cprichin/sheltrr.git ~/sheltrr
cd ~/sheltrr

# Set up Python backend
echo "Setting up backend..."
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
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Copy your rclone.conf to ~/sheltrr/backup/rclone.conf"
echo "  2. Log out and back in for Docker group changes to take effect"
echo "  3. Run: cd ~/sheltrr && docker-compose up -d --build"
