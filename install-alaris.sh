#!/bin/bash
# Run as: sudo -E bash install-alaris.sh
# -E preserves the calling user's HOME for nvm path resolution
set -euo pipefail

ALARIS_DIR="/home/symunona/wwwroot/alaris"
DOMAIN="alaris.benthegoose.com"
NGINX_CONF="/etc/nginx/sites-available/alaris.conf"
SERVICE_NAME="alaris"

echo "=== Installing Alaris ==="

# ── pnpm install ──────────────────────────────────────────────────────────────
echo "Installing Node dependencies..."
cd "$ALARIS_DIR"
sudo -u symunona /home/symunona/.local/bin/pnpm install --prod

# ── nginx ─────────────────────────────────────────────────────────────────────
echo "Installing nginx config..."

# The limit_req_zone directives must live in the http{} block of nginx.conf,
# not inside a server block. Check if they're already there.
if ! grep -q "zone=alaris_api" /etc/nginx/nginx.conf 2>/dev/null; then
    echo ""
    echo "ACTION REQUIRED: Add the following two lines inside the http{} block"
    echo "of /etc/nginx/nginx.conf (before the include lines), then re-run:"
    echo ""
    echo "    limit_req_zone \$binary_remote_addr zone=alaris_api:10m rate=5r/s;"
    echo "    limit_req_zone \$binary_remote_addr zone=alaris_general:10m rate=30r/s;"
    echo ""
    read -p "Press Enter once done (or Ctrl+C to abort)..."
fi

# Strip the limit_req_zone lines from the site conf (they're already in nginx.conf)
grep -v "^limit_req_zone" "$ALARIS_DIR/alaris.nginx.conf" > "$NGINX_CONF"

if [ ! -L "/etc/nginx/sites-enabled/alaris.conf" ]; then
    ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/alaris.conf
fi

# ── TLS cert ──────────────────────────────────────────────────────────────────
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "Obtaining Let's Encrypt certificate for $DOMAIN..."
    # Stop nginx temporarily so certbot standalone can bind port 80
    systemctl stop nginx
    certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos \
        -m bboborjan@gmail.com
    systemctl start nginx
else
    echo "Certificate already exists, skipping certbot."
fi

echo "Testing nginx config..."
nginx -t

echo "Reloading nginx..."
systemctl reload nginx

# ── systemd service ───────────────────────────────────────────────────────────
echo "Installing systemd service..."
cp "$ALARIS_DIR/alaris.service" "/etc/systemd/system/$SERVICE_NAME.service"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo ""
echo "Service status:"
systemctl status "$SERVICE_NAME" --no-pager

# ── daily backup cron ─────────────────────────────────────────────────────────
echo "Installing daily backup cron for symunona..."
chmod +x "$ALARIS_DIR/backup-alaris.sh"
CRON_LINE="0 3 * * * $ALARIS_DIR/backup-alaris.sh >> /home/symunona/alaris-backup.log 2>&1"
crontab -u symunona -l 2>/dev/null | grep -qF "backup-alaris.sh" || \
    (crontab -u symunona -l 2>/dev/null; echo "$CRON_LINE") | crontab -u symunona -

echo ""
echo "=== Done ==="
echo "  https://$DOMAIN"
