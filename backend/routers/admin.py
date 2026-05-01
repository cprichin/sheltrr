from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import subprocess
import json
import os
import hashlib

router = APIRouter()

def get_admin_password():
    return os.getenv("ADMIN_PASSWORD", "Sheltrr2026")

def get_token():
    password = get_admin_password()
    return hashlib.sha256(password.encode()).hexdigest()

def verify_token(authorization: str = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.replace("Bearer ", "").strip()
    if token != get_token():
        raise HTTPException(status_code=401, detail="Unauthorized")

def run_cmd(cmd):
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=10
        )
        return result.stdout.strip(), result.returncode == 0
    except Exception as e:
        return str(e), False


class LoginRequest(BaseModel):
    password: str


@router.post("/login")
def login(req: LoginRequest):
    if req.password != get_admin_password():
        raise HTTPException(status_code=401, detail="Incorrect password")
    token = get_token()
    return {"token": token}


@router.get("/status")
def get_system_status(authorization: str = Header(None)):
    verify_token(authorization)

    # Tailscale status
    ts_out, ts_ok = run_cmd(
        "tailscale --socket /var/run/tailscale/tailscaled.sock status --json 2>/dev/null || echo '{}'"
    )
    try:
        ts_data = json.loads(ts_out)
        ts_running = ts_data.get("BackendState") == "Running"
        ts_ip = None
        if ts_running and ts_data.get("Self"):
            addrs = ts_data["Self"].get("TailscaleIPs", [])
            ts_ip = addrs[0] if addrs else None
    except Exception:
        ts_running = False
        ts_ip = None

    # Docker container status
    containers_out, _ = run_cmd(
        "docker ps --format '{{.Names}}|{{.Status}}' 2>/dev/null"
    )
    containers = {}
    for line in containers_out.split("\n"):
        if "|" in line:
            name, status = line.split("|", 1)
            containers[name.strip()] = status.strip()

    # Last backup
    backup_out, _ = run_cmd(
        "docker logs sheltrr-backup 2>&1 | grep 'Backup complete' | tail -1"
    )
    last_backup = backup_out if backup_out else "No backup recorded yet"

    # Quick stats from database
    from database import SessionLocal
    from models import Dog, Volunteer, Walk
    db = SessionLocal()
    try:
        total_dogs = db.query(Dog).filter(Dog.active == True).count()
        total_volunteers = db.query(Volunteer).count()
        total_walks = db.query(Walk).filter(Walk.status == "completed").count()
        active_walks = db.query(Walk).filter(Walk.status == "active").count()
    finally:
        db.close()

    return {
        "tailscale": {
            "running": ts_running,
            "ip": ts_ip
        },
        "containers": {
            "sheltrr-db": containers.get("sheltrr-db", "not found"),
            "sheltrr-api": containers.get("sheltrr-api", "not found"),
            "sheltrr-dashboard": containers.get("sheltrr-dashboard", "not found"),
            "sheltrr-backup": containers.get("sheltrr-backup", "not found"),
        },
        "last_backup": last_backup,
        "stats": {
            "total_dogs": total_dogs,
            "total_volunteers": total_volunteers,
            "total_walks": total_walks,
            "active_walks": active_walks
        }
    }


@router.post("/tailscale/enable")
def enable_tailscale(authorization: str = Header(None)):
    verify_token(authorization)
    out, ok = run_cmd(
        "tailscale --socket /var/run/tailscale/tailscaled.sock up"
    )
    return {"success": ok, "message": out or "Tailscale enabled"}


@router.post("/tailscale/disable")
def disable_tailscale(authorization: str = Header(None)):
    verify_token(authorization)
    out, ok = run_cmd(
        "tailscale --socket /var/run/tailscale/tailscaled.sock down"
    )
    return {"success": ok, "message": out or "Tailscale disabled"}


@router.post("/backup")
def run_backup(authorization: str = Header(None)):
    verify_token(authorization)
    out, ok = run_cmd("docker exec sheltrr-backup /app/backup.sh")
    return {"success": ok, "message": out}
