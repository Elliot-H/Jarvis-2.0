#!/usr/bin/env bash
# Jarvis Node installer for Raspberry Pi OS (Bookworm). Run from this folder: bash install.sh
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get install -y alsa-utils
npm install --omit=dev
[ -f config.json ] || { cp config.example.json config.json; echo "Created config.json: edit it (token, light IPs, mic), then run: bash install.sh again"; exit 0; }
sudo tee /etc/systemd/system/jarvis-node.service >/dev/null <<UNIT
[Unit]
Description=Jarvis Node (lights + clapper)
After=network-online.target sound.target
Wants=network-online.target

[Service]
WorkingDirectory=$(pwd)
ExecStart=$(command -v node) $(pwd)/agent.js
Restart=always
RestartSec=5
User=$(whoami)
SupplementaryGroups=audio

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now jarvis-node
echo "Running. Logs: journalctl -u jarvis-node -f"
