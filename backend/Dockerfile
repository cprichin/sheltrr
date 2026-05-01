FROM python:3.11-slim
WORKDIR /app

# Install Docker CLI and Tailscale
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://get.docker.com | sh \
    && curl -fsSL https://tailscale.com/install.sh | sh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
