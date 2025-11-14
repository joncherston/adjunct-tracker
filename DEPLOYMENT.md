# Deployment Guide for SUSCC Adjunct Tracker

This guide explains how to deploy the Adjunct Tracker application to a VPS (e.g., app.suscholarsbowl.com).

## Prerequisites

- Ubuntu/Debian VPS with root access
- Domain pointed to your VPS IP address
- Python 3.11+ installed
- Node.js 18+ and npm installed
- Git installed

## Quick Deployment

```bash
# Clone the repository
git clone <your-repo-url> /var/www/adjunct-tracker
cd /var/www/adjunct-tracker

# Run the deployment script
sudo bash deploy/deploy.sh
```

## New Features

This application now includes **User Management** and **Profile Editing** features:

- **User Management** (`/users`) - Full CRUD operations for managing admin users
- **Profile Editing** - Self-service profile and password management

For comprehensive documentation on these features, including usage instructions, API endpoints, security considerations, and troubleshooting, see [NEW_FEATURES_SUMMARY.md](NEW_FEATURES_SUMMARY.md).

**Important**: After first deployment, log in with the default admin credentials and immediately:
1. Change the default admin password via the Profile button
2. Create additional admin users as needed via Manage Users

## Manual Deployment Steps

### 1. System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python, pip, and venv
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install nginx -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Application Setup

```bash
# Create application directory
sudo mkdir -p /var/www/adjunct-tracker
cd /var/www/adjunct-tracker

# Clone or copy your application files here
# Make sure to include both backend and frontend directories

# Create Python virtual environment
cd backend
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cp .env.example .env
nano .env  # Edit with your settings
```

### 3. Database Setup

```bash
# Run Alembic migrations
cd backend
source venv/bin/activate
alembic upgrade head

# Create initial admin user (optional Python script)
python scripts/create_admin.py
```

### 4. Frontend Build

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in frontend/dist/
```

### 5. Configure systemd Service

```bash
# Copy service file
sudo cp deploy/adjunct-tracker.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable adjunct-tracker
sudo systemctl start adjunct-tracker

# Check status
sudo systemctl status adjunct-tracker
```

### 6. Configure nginx

```bash
# Copy nginx configuration
sudo cp deploy/nginx.conf /etc/nginx/sites-available/adjunct-tracker

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/adjunct-tracker /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
# Obtain SSL certificate
sudo certbot --nginx -d app.suscholarsbowl.com

# Certbot will automatically configure nginx for HTTPS
```

## Environment Variables

Create a `.env` file in the `backend` directory with these variables:

```env
# Application
APP_NAME=SUSCC Adjunct Tracker
SECRET_KEY=your-secret-key-here-change-this
API_PREFIX=/api

# Database
DATABASE_URL=sqlite:///./adjunct_tracker.db

# CORS (adjust for your domain)
ALLOWED_ORIGINS=https://app.suscholarsbowl.com

# Email (Brevo/Sendinblue)
BREVO_API_KEY=your-brevo-api-key-here
SENDER_EMAIL=noreply@suscc.edu
SENDER_NAME=SUSCC Adjunct Faculty Committee

# Admin
DEFAULT_ADMIN_EMAIL=admin@suscc.edu
DEFAULT_ADMIN_PASSWORD=ChangeMe123!
DEFAULT_ADMIN_NAME=System Administrator
```

## Frontend Environment

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=https://app.suscholarsbowl.com/api
```

## Maintenance

### View Logs

```bash
# Backend logs
sudo journalctl -u adjunct-tracker -f

# nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart backend
sudo systemctl restart adjunct-tracker

# Restart nginx
sudo systemctl restart nginx
```

### Update Application

```bash
cd /var/www/adjunct-tracker

# Pull latest code
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# Update frontend
cd ../frontend
npm install
npm run build

# Restart services
sudo systemctl restart adjunct-tracker
sudo systemctl restart nginx
```

## Backup

### Database Backup

```bash
# Backup SQLite database
cp /var/www/adjunct-tracker/backend/adjunct_tracker.db /backup/adjunct_tracker_$(date +%Y%m%d).db
```

### Automated Backup Script

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * /var/www/adjunct-tracker/deploy/backup.sh
```

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong SECRET_KEY in .env
- [ ] Configure firewall (UFW)
- [ ] Enable SSL/HTTPS
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Restrict file permissions
- [ ] Monitor logs for suspicious activity

## Troubleshooting

### Backend won't start

```bash
# Check logs
sudo journalctl -u adjunct-tracker -n 50

# Check if port 8000 is in use
sudo lsof -i :8000

# Verify virtual environment
which python  # Should show venv path
```

### Frontend not loading

```bash
# Verify build exists
ls -la /var/www/adjunct-tracker/frontend/dist/

# Check nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Database errors

```bash
# Check database file permissions
ls -la /var/www/adjunct-tracker/backend/*.db

# Run migrations
cd /var/www/adjunct-tracker/backend
source venv/bin/activate
alembic upgrade head
```

## Support

For issues or questions:
- Email: IT Support at SUSCC
- Check logs first
- Review this documentation

## License

Internal use only - Southern Union State Community College
