# 🐾 Sheltrr
### Dog Walk Tracking System for Animal Shelters
*Built by FMC Technologies*

---

## Overview

Sheltrr is a purpose-built dog walk tracking system for animal shelters. It replaces paper sign-in sheets with a fast NFC-based workflow. Volunteers tap a fob and a cage tag to log walks — no typing, no app installs, no manual data entry.

All components run in Docker containers on a local Ubuntu server at the shelter. The system functions fully without internet — internet is only required for Tailscale remote access and nightly Google Drive backups.

---

## System Components

| Component | Description | Port |
|---|---|---|
| `sheltrr-db` | PostgreSQL 15 database | 5432 |
| `sheltrr-api` | FastAPI backend | 8000 |
| `sheltrr-dashboard` | React dashboard + PWA (nginx) | 80 |
| `sheltrr-backup` | Nightly rclone backup to Google Drive | — |

### Tech Stack
- **Backend:** Python 3.11 + FastAPI + SQLAlchemy
- **Database:** PostgreSQL 15
- **Frontend:** React 18
- **Scanner PWA:** Vanilla HTML/JS + Web NFC API
- **Containerization:** Docker + Docker Compose
- **Remote Access:** Tailscale
- **Backup:** rclone + Google Drive

---

## Dashboard Features

| Tab | Description |
|---|---|
| Status Board | Grid view of every dog — Out Now / Walked Today / Not Yet Walked. Configurable overdue alert. |
| Active Walks | All dogs currently out with volunteer name and duration. Auto-refreshes every 15 seconds. |
| History | All completed walks, filterable by dog or volunteer. |
| Dogs | Add and remove dog records. |
| Cages | Register cage NFC tags and assign dogs to cages. |
| Volunteers | Add and remove volunteer records. |
| Summary | Daily walk summary with stats and CSV export. |

---

## Quick Start — Fresh Ubuntu Setup

```bash
# 1. Download and run the setup script
curl -O https://raw.githubusercontent.com/cprichin/sheltrr/main/setup.sh
chmod +x setup.sh
./setup.sh

# 2. Apply Docker group change
newgrp docker

# 3. Find your local IP
ip addr show | grep 'inet '

# 4. Set the IP in config files
nano dashboard/.env.production
# REACT_APP_API_URL=http://YOUR_IP:8000/api

nano dashboard/pwa/config.js
# const CONFIG = { API: `http://${window.location.hostname}:8000/api` };

# 5. Set up rclone (use shelter's Google account on production)
rclone config
cp ~/.config/rclone/rclone.conf backup/rclone.conf

# 6. Build and start
cd ~/sheltrr
docker-compose up -d --build

# 7. Verify
docker ps
# Should show: sheltrr-db, sheltrr-api, sheltrr-dashboard, sheltrr-backup
```

Open the dashboard at `http://YOUR_IP`

---

## Shelter Deployment

Use the automated deployment script on a fresh Ubuntu server:

```bash
curl -O https://raw.githubusercontent.com/cprichin/sheltrr/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

The script will prompt for a Tailscale auth key and handle everything automatically including Google Drive authorization.

---

## Access URLs

| URL | Description |
|---|---|
| `http://SERVER_IP` | Staff dashboard |
| `http://SERVER_IP:8000/docs` | API documentation |
| `http://SERVER_IP/pwa/index.html` | Volunteer scanner PWA |
| `http://SERVER_IP/pwa/setup.html` | Admin setup page |

---

## Daily Dev Workflow

```bash
# Start everything
cd ~/sheltrr
docker-compose up -d

# After code changes
docker-compose up -d --build

# Stop everything (never use -v in production)
docker-compose down

# View logs
docker-compose logs -f api
docker-compose logs -f dashboard
docker-compose logs -f

# Push to GitHub
git add .
git commit -m "description"
git push
```

---

## Volunteer Workflow

**Checking a dog out:**
1. Pick up the Android scanner from its dock
2. Tap volunteer fob to the phone — confirms identity
3. Tap cage NFC tag — logs walk start

**Checking a dog in:**
1. Pick up the scanner
2. Tap volunteer fob
3. Tap cage NFC tag — ends walk, records duration

---

## NFC Tag Programming

Use a **Flipper Zero** or **ACS ACR1552U** to read tag UIDs before installation:

**Flipper Zero:** NFC → Read → tap tag → note UID

**ACR1552U Python script:**
```python
import nfc

def on_connect(tag):
    print(f"Tag UID: {tag.identifier.hex().upper()}")
    return True

with nfc.ContactlessFrontend('usb') as clf:
    clf.connect(rdwr={'on-connect': on_connect})
```

---

## Backup

Nightly backups run at 2:00 AM to the shelter's Google Drive under a folder called `Sheltrr Backups`. 7-day retention.

**Test manually:**
```bash
docker exec sheltrr-backup /app/backup.sh
```

**Restore from backup:**
```bash
# Copy backup file to server
scp sheltrr_backup_YYYY-MM-DD.sql USER@TAILSCALE_IP:/tmp/

# SSH in and restore
ssh USER@TAILSCALE_IP
docker exec -i sheltrr-db psql -U sheltrr -d sheltrr < /tmp/sheltrr_backup_YYYY-MM-DD.sql
```

> ⚠️ Never run `docker-compose down -v` in production — this deletes the database volume.

---

## Remote Access

```bash
# SSH into shelter server
ssh USER@TAILSCALE_IP

# Push update remotely
ssh USER@TAILSCALE_IP "cd /opt/sheltrr && git pull && docker-compose up -d --build"
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Dashboard won't load | Check `docker ps` — confirm sheltrr-api is Up |
| 404 on API routes | Kill stale processes on port 8000, restart uvicorn |
| NFC not working | Chrome on Android only. Enable NFC in device settings. |
| Cage tag not recognized | Tag not registered — add via setup page |
| Fob not recognized | Volunteer not registered — add via setup page |
| Database empty after redeploy | Never use `docker-compose down -v`. Restore from backup. |
| Backup fails | Check rclone.conf exists at backup/rclone.conf. Re-run rclone config if token expired. |
| Can't SSH via Tailscale | Run `sudo tailscale status` on server. Check admin panel. |

---

## Support

**FMC Technologies**
chris@fastmanacollective.com

Remote support: $40/incident + $20/hr
On-site: $75 minimum
First 30 days post-installation: included
