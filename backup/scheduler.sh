#!/bin/bash

echo "Backup scheduler started. Running daily at 02:00 AM."

while true; do
  # Get current hour and minute
  CURRENT=$(date +%H:%M)
  
  if [ "$CURRENT" = "02:00" ]; then
    /app/backup.sh
    # Sleep 61 seconds to avoid running twice in the same minute
    sleep 61
  fi
  
  sleep 60
done