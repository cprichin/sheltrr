#!/bin/bash

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="sheltrr_backup_${TIMESTAMP}.sql"
BACKUP_PATH="/tmp/${FILENAME}"
DRIVE_FOLDER="Sheltrr Backups"
RETENTION_DAYS=7
RCLONE_CONFIG="/tmp/rclone.conf"

echo "Starting backup at ${TIMESTAMP}"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting backup" >> /var/log/sheltrr-backup.log
# Dump the database
PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  -f $BACKUP_PATH

if [ $? -ne 0 ]; then
  echo "Database dump failed"
  exit 1
fi

echo "Database dumped successfully"

# Upload to Google Drive
rclone copy $BACKUP_PATH "gdrive:${DRIVE_FOLDER}/" --config $RCLONE_CONFIG

if [ $? -ne 0 ]; then
  echo "Upload to Google Drive failed"
  exit 1
fi

echo "Uploaded ${FILENAME} to Google Drive"

# Clean up local temp file
rm $BACKUP_PATH

# Delete backups older than 7 days from Drive
rclone delete "gdrive:${DRIVE_FOLDER}/" \
  --config $RCLONE_CONFIG \
  --min-age ${RETENTION_DAYS}d

echo "Cleaned up backups older than ${RETENTION_DAYS} days"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup complete" >> /var/log/sheltrr-backup.log
echo "Backup complete"
