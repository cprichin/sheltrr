# Sheltrr — Quick Start Guide
**FMC Technologies** | Version 1.0

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Deployment at the Shelter](#deployment-at-the-shelter)
4. [Configuring the PWA Scanners](#configuring-the-pwa-scanners)
5. [Adding Dogs & Volunteers](#adding-dogs--volunteers)
6. [Programming NFC Tags & Fobs](#programming-nfc-tags--fobs)
7. [Daily Usage](#daily-usage)
8. [Pushing Updates Remotely](#pushing-updates-remotely)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

Sheltrr is a dog walk tracking system for animal shelters. It consists of three components:

| Component | Description | Access |
|---|---|---|
| **Backend API** | FastAPI + PostgreSQL, handles all data | Port 8000 |
| **Dashboard** | React web UI for staff | Port 80 (http://SERVER_IP) |
| **Scanner PWA** | HTML app on Android devices | Open index.html in Chrome |

All three components run in Docker containers managed by Docker Compose.

---

## Prerequisites

The shelter server needs:
- **OS:** Ubuntu 22.04+ (or any Linux distro)
- **Docker:** Install with `curl -fsSL https://get.docker.com | sh`
- **Docker Compose:** Usually included with Docker Desktop; on Linux run `sudo apt install docker-compose-plugin`
- **Git:** `sudo apt install git`
- **Tailscale:** For remote access (see below)

The Android scanner devices need:
- Android 9+ with Chrome browser
- Connected to the shelter's WiFi network

---

## Deployment at the Shelter

### Step 1 — Set up Tailscale on the server
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```
Follow the link it prints to authenticate. The server will appear in your Tailscale admin panel at https://login.tailscale.com/admin/machines.

### Step 2 — Clone the repository
```bash
sudo mkdir /opt/sheltrr
sudo chown $USER /opt/sheltrr
git clone https://github.com/YOUR_REPO/sheltrr.git /opt/sheltrr
cd /opt/sheltrr
```

### Step 3 — Configure the API URL
Edit the dashboard environment file:
```bash
nano dashboard/.env.production
```
Set the server's local IP:
```
REACT_APP_API_URL=http://192.168.X.X:8000/api
```
> Find the server's local IP with: `ip addr show | grep inet`

Also update the PWA config:
```bash
nano pwa/config.js
```
```javascript
const CONFIG = {
  API: "http://192.168.X.X:8000/api"
};
```

### Step 4 — Build and start all containers
```bash
cd /opt/sheltrr
docker-compose up -d --build
```

### Step 5 — Verify everything is running
```bash
docker ps
```
You should see three containers running:
- `sheltrr-db` — PostgreSQL database
- `sheltrr-api` — FastAPI backend
- `sheltrr-dashboard` — React dashboard (nginx)

### Step 6 — Open the dashboard
On any browser on the shelter network, go to:
```
http://SERVER_LOCAL_IP
```
You should see the Sheltrr dashboard.

---

## Configuring the PWA Scanners

1. Open Chrome on each Android device
2. Navigate to `http://SERVER_LOCAL_IP/pwa/index.html`
   > Or copy the `pwa/index.html` file to the device and open it directly
3. Add it to the home screen: Chrome menu → **Add to Home Screen**
4. The app will now appear as a full-screen icon on the device

> **Note:** Web NFC requires HTTPS in Chrome. For local network use, either set up a self-signed SSL certificate on nginx, or access the PWA via Tailscale's HTTPS endpoint.

---

## Adding Dogs & Volunteers

### Via the Dashboard (recommended)
1. Open the dashboard at `http://SERVER_LOCAL_IP`
2. Click the **Dogs** tab
3. Fill in the dog's name, breed, cage number, NFC tag UID, and location
4. Click **Add Dog**

Repeat the same process under the **Volunteers** tab for each volunteer.

> The NFC Tag UID is the unique identifier programmed onto each physical tag. See the next section for how to read these UIDs.

### Via the API (bulk entry)
Go to `http://SERVER_LOCAL_IP:8000/docs` and use the interactive POST endpoints to add records directly.

---

## Programming NFC Tags & Fobs

Before sticking tags on cages, you need to read each tag's unique UID using the ACS ACR1552U NFC writer connected to a laptop.

### Install the Python reader script
```bash
pip install nfcpy
```

### Read a tag's UID
```python
import nfc

def on_connect(tag):
    print(f"Tag UID: {tag.identifier.hex().upper()}")
    return True

with nfc.ContactlessFrontend('usb') as clf:
    clf.connect(rdwr={'on-connect': on_connect})
```

Run the script, tap each tag to the reader, and note the UID. Enter that UID when adding the dog or volunteer in the dashboard.

### Label each tag
Before sticking tags on cages, write the cage number on the back of each tag with a marker so you can match them up during installation.

### Placement
- **Indoor cage tags:** Stick to the front of the cage frame at a consistent height
- **Outdoor run tags:** Use epoxy-coated tags rated for weather exposure, mounted on the gate post
- **Volunteer fobs:** Distribute to volunteers with their name written on a label

---

## Daily Usage

### Checking a Dog Out
1. Pick up the shared Android scanner
2. **Tap your NFC fob** to the back of the phone — the app confirms your identity
3. Walk to the dog's cage and **tap the cage NFC tag** — the walk is logged
4. Take the dog out

### Checking a Dog In
1. Pick up the scanner
2. **Tap your NFC fob**
3. **Tap the same cage tag** — the walk is ended and duration is recorded
4. Return the scanner to its charging dock

### Monitoring from the Dashboard
Staff at the front desk can open `http://SERVER_LOCAL_IP` in any browser to see:
- **Active Walks** — all dogs currently out, with volunteer name and duration
- **History** — completed walks filterable by dog or volunteer
- **Dogs** — add, view, or remove dog records
- **Volunteers** — add, view, or remove volunteer records

The Active Walks view refreshes automatically every 15 seconds.

---

## Pushing Updates Remotely

From your development machine (connected to Tailscale):

```bash
# SSH into the shelter server
ssh user@SHELTER_TAILSCALE_IP

# Pull latest code and redeploy
cd /opt/sheltrr
git pull
docker-compose up -d --build
```

Or as a single one-liner:
```bash
ssh user@SHELTER_TAILSCALE_IP "cd /opt/sheltrr && git pull && docker-compose up -d --build"
```

This will rebuild only the changed containers and restart them with zero downtime on the database.

---

## Troubleshooting

### Dashboard shows "Loading..." or data won't appear
- Confirm the backend is running: `docker ps` — look for `sheltrr-api` with status `Up`
- Check the API URL in `dashboard/.env.production` matches the server's actual IP
- Rebuild after any config change: `docker-compose up -d --build`

### Scanner PWA won't connect to API
- Confirm the device is on the same WiFi network as the server
- Check `pwa/config.js` has the correct server IP
- Try accessing `http://SERVER_IP:8000` in Chrome on the device — if it loads, the API is reachable

### NFC not working on Android
- Web NFC only works in **Chrome** on Android — no other browser
- Web NFC requires **HTTPS** — set up SSL or use Tailscale HTTPS
- Make sure NFC is enabled on the device: Settings → Connected Devices → NFC

### A dog scan returns "Cage tag not recognized"
- The tag's UID hasn't been added to the system yet
- Go to the Dogs tab in the dashboard and add the dog with the correct NFC tag UID

### A fob scan returns "Volunteer fob not recognized"
- The fob's UID hasn't been added to the system yet
- Go to the Volunteers tab and add the volunteer with their fob UID

### Database is empty after redeployment
- This is normal if the `pgdata` Docker volume was deleted
- The volume persists data between container restarts — only `docker-compose down -v` removes it
- Never run `docker-compose down -v` in production

### Restarting all containers
```bash
docker-compose restart
```

### Viewing live logs
```bash
# All containers
docker-compose logs -f

# API only
docker-compose logs -f api

# Database only
docker-compose logs -f db
```

---

*Sheltrr v1.0 — FMC Technologies*
*Support: chris@fastmanacollective.com*
