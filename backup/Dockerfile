FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    unzip \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Install rclone
RUN curl https://rclone.org/install.sh | bash

WORKDIR /app
COPY backup.sh .
COPY scheduler.sh .

RUN dos2unix backup.sh scheduler.sh
RUN chmod +x backup.sh scheduler.sh

# Copy rclone config to writable location at startup
CMD ["/bin/sh", "-c", "cp /app/rclone.conf /tmp/rclone.conf && /app/scheduler.sh"]
