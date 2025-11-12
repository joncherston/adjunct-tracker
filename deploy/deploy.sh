#!/bin/bash

# Deployment script for SUSCC Adjunct Tracker
# Run this script as root or with sudo

set -e  # Exit on error

echo "====================================="
echo "SUSCC Adjunct Tracker Deployment"
echo "====================================="
echo ""

# Configuration
APP_DIR="/var/www/adjunct-tracker"
DOMAIN="app.suscholarsbowl.com"
USER="www-data"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Please run as root or with sudo"
  exit 1
fi

echo "[1/8] Installing system dependencies..."
apt update
apt install -y python3.11 python3.11-venv python3-pip nodejs npm nginx certbot python3-certbot-nginx git

echo "[2/8] Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# If this is a new deployment, we assume files are already here
# In a real scenario, you'd clone from git here

echo "[3/8] Setting up Python environment..."
cd $APP_DIR/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "[4/8] Setting up environment files..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo "WARNING: No .env file found. Creating template..."
    cat > $APP_DIR/backend/.env <<EOL
APP_NAME=SUSCC Adjunct Tracker
SECRET_KEY=$(openssl rand -hex 32)
API_PREFIX=/api
DATABASE_URL=sqlite:///./adjunct_tracker.db
ALLOWED_ORIGINS=https://$DOMAIN
BREVO_API_KEY=your-brevo-api-key-here
SENDER_EMAIL=noreply@suscc.edu
SENDER_NAME=SUSCC Adjunct Faculty Committee
DEFAULT_ADMIN_EMAIL=admin@suscc.edu
DEFAULT_ADMIN_PASSWORD=ChangeMe123!
DEFAULT_ADMIN_NAME=System Administrator
EOL
    echo "IMPORTANT: Edit $APP_DIR/backend/.env with your settings!"
fi

echo "[5/8] Running database migrations..."
cd $APP_DIR/backend
source venv/bin/activate
alembic upgrade head

echo "[6/8] Building frontend..."
cd $APP_DIR/frontend

# Create frontend .env
if [ ! -f "$APP_DIR/frontend/.env" ]; then
    cat > $APP_DIR/frontend/.env <<EOL
VITE_API_URL=https://$DOMAIN/api
EOL
fi

npm install
npm run build

echo "[7/8] Setting up systemd service..."
cp $APP_DIR/deploy/adjunct-tracker.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable adjunct-tracker
systemctl restart adjunct-tracker

echo "[8/8] Configuring nginx..."
cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/adjunct-tracker
ln -sf /etc/nginx/sites-available/adjunct-tracker /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo ""
echo "====================================="
echo "Deployment Complete!"
echo "====================================="
echo ""
echo "Next steps:"
echo "1. Edit $APP_DIR/backend/.env with your configuration"
echo "2. Restart the service: sudo systemctl restart adjunct-tracker"
echo "3. Obtain SSL certificate: sudo certbot --nginx -d $DOMAIN"
echo "4. Access your application at: https://$DOMAIN"
echo ""
echo "Service status: sudo systemctl status adjunct-tracker"
echo "View logs: sudo journalctl -u adjunct-tracker -f"
echo ""
