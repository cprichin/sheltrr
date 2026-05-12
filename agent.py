"""
Sheltrr Host Agent
Runs on the Windows host and allows the Docker API container
to control Tailscale via HTTP requests.

Start automatically: added to Windows Task Scheduler by deploy-windows-part2.ps1
Manual start: python agent.py
"""

import http.server
import json
import subprocess
import socket
import sys
from urllib.parse import urlparse

PORT = 5555
ALLOWED_PREFIXES = ("127.", "172.", "10.", "192.168.")


def run_tailscale(args):
    try:
        result = subprocess.run(
            ["tailscale"] + args,
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.stdout.strip() or result.stderr.strip(), result.returncode == 0
    except FileNotFoundError:
        return "Tailscale not found — is it installed?", False
    except Exception as e:
        return str(e), False


class AgentHandler(http.server.BaseHTTPRequestHandler):

    def is_allowed(self):
        client_ip = self.client_address[0]
        return any(client_ip.startswith(prefix) for prefix in ALLOWED_PREFIXES)

    def send_json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if not self.is_allowed():
            self.send_json(403, {"error": "Forbidden"})
            return

        path = urlparse(self.path).path

        if path == "/tailscale/status":
            out, ok = run_tailscale(["status", "--json"])
            try:
                data = json.loads(out)
                running = data.get("BackendState") == "Running"
                ip = None
                if running and data.get("Self"):
                    addrs = data["Self"].get("TailscaleIPs", [])
                    ip = addrs[0] if addrs else None
                self.send_json(200, {"running": running, "ip": ip})
            except Exception:
                self.send_json(200, {"running": False, "ip": None})

        elif path == "/health":
            self.send_json(200, {"status": "ok"})

        else:
            self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        if not self.is_allowed():
            self.send_json(403, {"error": "Forbidden"})
            return

        path = urlparse(self.path).path

        if path == "/tailscale/enable":
            out, ok = run_tailscale(["up"])
            self.send_json(200, {"success": ok, "message": out or "Tailscale enabled"})

        elif path == "/tailscale/disable":
            out, ok = run_tailscale(["down"])
            self.send_json(200, {"success": ok, "message": out or "Tailscale disabled"})

        else:
            self.send_json(404, {"error": "Not found"})

    def log_message(self, format, *args):
        # Suppress default request logging — use our own
        print(f"[Agent] {self.client_address[0]} {args[0]}")


def main():
    # Check Tailscale is available
    _, ok = run_tailscale(["version"])
    if not ok:
        print("[Agent] WARNING: tailscale command not found. Make sure Tailscale is installed.")

    server = http.server.HTTPServer(("0.0.0.0", PORT), AgentHandler)
    print(f"[Agent] Sheltrr Host Agent running on port {PORT}")
    print(f"[Agent] Accepting connections from Docker and localhost only")
    print(f"[Agent] Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[Agent] Stopped.")
        server.shutdown()


if __name__ == "__main__":
    main()
