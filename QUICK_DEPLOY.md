# Quick Deployment Guide

This guide explains how to deploy updates to your SUSCC Adjunct Tracker application on your VPS.

## First-Time Setup on VPS

When setting up for the first time or switching to a new branch:

```bash
# Navigate to project directory
cd /path/to/adjunct-tracker

# Fetch all branches
git fetch origin

# Switch to the active development branch
git checkout claude/tracking-web-app-01RteTSqPAJFar94UfTq5CFb

# Make deployment script executable (one time only)
chmod +x deploy.sh

# Run initial deployment
./deploy.sh
```

## Regular Updates (Easy Method)

Once you're on the correct branch, deploying updates is simple:

```bash
cd /path/to/adjunct-tracker
./deploy.sh
```

That's it! The script will:
- ✓ Pull the latest changes from your current branch
- ✓ Show you what changed
- ✓ Rebuild the Docker containers
- ✓ Restart the application
- ✓ Display container status

## Manual Deployment (If Needed)

If you prefer to run commands manually:

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose up -d --build

# View status
docker compose ps

# View logs (optional)
docker compose logs -f
```

## Checking Application Status

```bash
# View running containers
docker compose ps

# View live logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

## Troubleshooting

### "Already up to date" but changes exist

Make sure you're on the correct branch:

```bash
git branch  # Should show: claude/tracking-web-app-01RteTSqPAJFar94UfTq5CFb
git fetch origin
git pull origin claude/tracking-web-app-01RteTSqPAJFar94UfTq5CFb
```

### Application not responding after deployment

```bash
# Check container status
docker compose ps

# View logs for errors
docker compose logs backend
docker compose logs frontend

# Restart all services
docker compose restart

# Full rebuild (if needed)
docker compose down
docker compose up -d --build
```

### Database migrations needed

If you see database errors after deployment:

```bash
# Enter backend container
docker compose exec backend bash

# Run migrations
alembic upgrade head

# Exit container
exit

# Restart backend
docker compose restart backend
```

### Port conflicts

If ports 8000 or 5173 are already in use:

```bash
# Find what's using the port
sudo lsof -i :8000
sudo lsof -i :5173

# Stop the conflicting process or modify docker-compose.yml ports
```

## Environment Variables

Important environment variables are in `.env` file in the backend directory.

Key settings to verify:
- `BREVO_API_KEY` - For email notifications
- `FRONTEND_URL` - Should match your domain
- `ALLOWED_ORIGINS` - Should include your domain
- `DATABASE_URL` - Database connection string

After changing `.env`, restart services:

```bash
docker compose restart
```

## Active Development Branch

Current active branch: `claude/tracking-web-app-01RteTSqPAJFar94UfTq5CFb`

This branch contains all the latest fixes and features. Always pull from this branch for updates.

## Getting Help

- Check logs: `docker compose logs -f`
- View CHANGELOG.md for recent changes
- Check container status: `docker compose ps`
- Full restart: `docker compose down && docker compose up -d --build`

---

**Last Updated:** 2025-11-15
