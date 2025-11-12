#!/bin/bash

# Backup script for SUSCC Adjunct Tracker
# Add to crontab: 0 2 * * * /var/www/adjunct-tracker/deploy/backup.sh

APP_DIR="/var/www/adjunct-tracker"
BACKUP_DIR="/backup/adjunct-tracker"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "Starting backup at $(date)"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
echo "Backing up database..."
cp $APP_DIR/backend/adjunct_tracker.db $BACKUP_DIR/adjunct_tracker_$DATE.db

# Backup environment files
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
    $APP_DIR/backend/.env \
    $APP_DIR/frontend/.env

# Remove old backups (older than retention period)
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "adjunct_tracker_*.db" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "config_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed at $(date)"
echo "Backup location: $BACKUP_DIR"
