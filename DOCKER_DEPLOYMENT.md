# Docker Deployment Guide for SUSCC Adjunct Tracker

This guide provides step-by-step instructions for deploying the Adjunct Tracker application using Docker on your VPS.

## Server Details

- **Domain**: adjunct.suscholarsbowl.com
- **Server IP**: 155.138.202.96
- **Platform**: Ubuntu 22.04/24.04

## Prerequisites

- Ubuntu VPS with root/sudo access
- Domain DNS pointed to server IP (already configured: adjunct.suscholarsbowl.com → 155.138.202.96)
- Port 80 and 443 open on firewall

## Quick Start

### 1. Install Docker and Docker Compose

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (optional, allows running docker without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version
```

### 2. Install Nginx (Reverse Proxy) and Certbot (SSL)

```bash
# Install nginx
sudo apt install nginx -y

# Install certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx -y
```

### 3. Clone the Repository

```bash
# Create application directory
sudo mkdir -p /var/www/adjunct-tracker
cd /var/www/adjunct-tracker

# Clone the repository
git clone https://github.com/joncherston/adjunct-tracker.git .

# Or if using a specific branch
git clone -b claude/adjunct-tracker-full-stack-011CV2nvqKFdwaUNFXKBRPGu https://github.com/joncherston/adjunct-tracker.git .
```

### 4. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit environment file with your settings
nano .env
```

**Important**: Set these values in `.env`:
```env
SECRET_KEY=your-long-random-secret-key-here-use-at-least-32-characters
DEFAULT_ADMIN_EMAIL=admin@suscc.edu
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123!
BREVO_API_KEY=your-brevo-api-key-here
SENDER_EMAIL=noreply@suscc.edu
```

**Generate a secure SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Configure Nginx Reverse Proxy

Create nginx configuration for the domain:

```bash
sudo nano /etc/nginx/sites-available/adjunct-tracker
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name adjunct.suscholarsbowl.com;

    # Redirect to HTTPS (will be configured by certbot)
    # For now, proxy to Docker container

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Increase max upload size if needed
    client_max_body_size 10M;
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/adjunct-tracker /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 6. Build and Start Docker Containers

```bash
# Navigate to project directory
cd /var/www/adjunct-tracker

# Build and start containers
docker compose up -d --build

# View logs to ensure everything started correctly
docker compose logs -f

# Press Ctrl+C to exit logs view
```

**Verify containers are running:**
```bash
docker compose ps
```

You should see both `adjunct-tracker-backend` and `adjunct-tracker-frontend` containers running.

### 7. Configure SSL Certificate (HTTPS)

```bash
# Obtain SSL certificate from Let's Encrypt
sudo certbot --nginx -d adjunct.suscholarsbowl.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose to redirect HTTP to HTTPS (recommended)
```

Certbot will automatically:
- Obtain the SSL certificate
- Update nginx configuration for HTTPS
- Set up auto-renewal

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

### 8. Verify Deployment

1. **Test the application:**
   - Visit https://adjunct.suscholarsbowl.com
   - You should see the login page

2. **Login with default admin credentials:**
   - Email: `admin@suscc.edu` (or what you set in .env)
   - Password: `ChangeMe123!` (or what you set in .env)

3. **IMPORTANT - First Steps After Login:**
   - Click the **Profile** button (gold button in top right)
   - Change your password immediately
   - Update your profile information
   - Go to **Manage Users** to create additional admin accounts

### 9. Configure Firewall (UFW)

```bash
# Enable UFW if not already enabled
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

## Maintenance Commands

### View Logs

```bash
# View all logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View frontend logs only
docker compose logs -f frontend

# View last 100 lines
docker compose logs --tail=100
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

### Stop Services

```bash
# Stop all containers
docker compose down

# Stop and remove volumes (WARNING: deletes database)
docker compose down -v
```

### Update Application

```bash
cd /var/www/adjunct-tracker

# Pull latest code
git pull origin main

# Rebuild and restart containers
docker compose up -d --build

# View logs to verify update
docker compose logs -f
```

### Database Backup

```bash
# Create backup directory
mkdir -p /var/backups/adjunct-tracker

# Backup database
cp /var/www/adjunct-tracker/backend/data/adjunct_tracker.db \
   /var/backups/adjunct-tracker/adjunct_tracker_$(date +%Y%m%d_%H%M%S).db

# List backups
ls -lh /var/backups/adjunct-tracker/
```

**Automated Backup (Optional):**

Create a backup script:

```bash
sudo nano /usr/local/bin/backup-adjunct-tracker.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/adjunct-tracker"
SOURCE_DB="/var/www/adjunct-tracker/backend/data/adjunct_tracker.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
cp "$SOURCE_DB" "$BACKUP_DIR/adjunct_tracker_$TIMESTAMP.db"

# Keep only last 30 backups
cd "$BACKUP_DIR"
ls -t adjunct_tracker_*.db | tail -n +31 | xargs -r rm
```

Make executable and add to crontab:

```bash
sudo chmod +x /usr/local/bin/backup-adjunct-tracker.sh

# Add to crontab (runs daily at 2 AM)
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup-adjunct-tracker.sh
```

## Troubleshooting

### Container won't start

```bash
# Check container logs
docker compose logs backend
docker compose logs frontend

# Check container status
docker compose ps

# Rebuild from scratch
docker compose down
docker compose up -d --build
```

### Cannot connect to application

```bash
# Check if containers are running
docker compose ps

# Check nginx status
sudo systemctl status nginx

# Check nginx configuration
sudo nginx -t

# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if port 3000 is accessible
curl http://localhost:3000
```

### Database errors

```bash
# Access backend container
docker compose exec backend bash

# Inside container, check database file
ls -la /app/data/

# Run migrations manually
alembic upgrade head

# Exit container
exit
```

### SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check nginx SSL configuration
sudo nginx -t
```

### "Permission denied" errors

```bash
# Fix ownership of application directory
sudo chown -R $USER:$USER /var/www/adjunct-tracker

# Fix permissions on database directory
sudo chmod -R 755 /var/www/adjunct-tracker/backend/data
```

## Security Checklist

- [x] SSL/HTTPS configured with Let's Encrypt
- [ ] Changed default admin password
- [ ] Set strong SECRET_KEY in .env
- [ ] Firewall (UFW) configured
- [ ] Regular backups configured
- [ ] Brevo API key configured for email notifications
- [ ] Additional admin users created (don't rely on single admin)
- [ ] Server packages kept up to date (`sudo apt update && sudo apt upgrade`)

## Resource Usage

This application is very lightweight:
- **CPU**: < 5% under normal load
- **Memory**: ~200-300 MB total (both containers)
- **Disk**: ~500 MB (including Docker images)
- **Network**: Minimal

Perfect for running alongside other applications on the same server.

## Support

For issues or questions:
1. Check the logs first: `docker compose logs -f`
2. Review this troubleshooting guide
3. Check [NEW_FEATURES_SUMMARY.md](NEW_FEATURES_SUMMARY.md) for feature documentation
4. Review [DEPLOYMENT.md](DEPLOYMENT.md) for traditional deployment options

## Next Steps

After successful deployment:
1. ✅ Login and change default admin password
2. ✅ Update admin profile information
3. ✅ Create additional admin users
4. ✅ Configure Brevo API for email notifications
5. ✅ Set up automated backups
6. ✅ Test all features (User Management, Profile Editing, etc.)
7. ✅ Monitor logs for first few days

Congratulations! Your SUSCC Adjunct Tracker is now live at https://adjunct.suscholarsbowl.com 🎉
