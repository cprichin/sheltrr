FROM python:3.11-slim

# Install postgresql-client for pg_dump and curl for rclone install
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install rclone
RUN curl https://rclone.org/install.sh | bash

WORKDIR /app
COPY backup.sh .
COPY scheduler.sh .
RUN chmod +x backup.sh scheduler.sh

CMD ["/app/scheduler.sh"]