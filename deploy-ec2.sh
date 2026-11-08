#!/usr/bin/env bash
# ==============================================================================
# Student Document System (DocVault) - Automated EC2 Deployment Script
# Supports: Ubuntu 20.04 / 22.04 / 24.04 LTS on any AWS Account
# ==============================================================================

set -e

echo "🚀 Starting Automated Deployment for DocVault System..."

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt-get update -y

# 2. Setup 2GB Swap Memory (Crucial for t2.micro/t3.micro instances)
if [ ! -f /swapfile ]; then
    echo "🧠 Creating 2GB swap memory to prevent out-of-memory during builds..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap memory enabled."
else
    echo "✅ Swap memory already present."
fi

# 3. Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    rm -f get-docker.sh
    echo "✅ Docker installed successfully."
else
    echo "✅ Docker is already installed."
fi

# 4. Install Docker Compose plugin if not installed
if ! docker compose version &> /dev/null; then
    echo "📦 Installing Docker Compose plugin..."
    sudo apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose plugin installed."
else
    echo "✅ Docker Compose is already installed."
fi

# 5. Check and configure .env.production
if [ ! -f .env.production ]; then
    echo "⚙️ Creating .env.production from template..."
    cp .env.production.example .env.production
fi

# Auto-generate secure JWT Secret and DB password if placeholders exist
RANDOM_JWT=$(openssl rand -hex 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 48)
RANDOM_DB_PASS=$(openssl rand -hex 16 2>/dev/null || date +%s | sha256sum | head -c 16)

sed -i "s/your-secure-db-password/$RANDOM_DB_PASS/g" .env.production
sed -i "s/generate-a-64-character-random-hex-string-for-production/$RANDOM_JWT/g" .env.production

# Detect Public IP and replace placeholder
PUBLIC_IP=$(curl -s --connect-timeout 3 ifconfig.me || curl -s --connect-timeout 3 icanhazip.com || echo "")
if [ -n "$PUBLIC_IP" ]; then
    sed -i "s|http://your-ec2-public-ip|http://$PUBLIC_IP|g" .env.production
    sed -i "s|http://your-ec2-ip|http://$PUBLIC_IP|g" .env.production
    echo "🌐 Detected Public IP: $PUBLIC_IP"
fi

# Check S3 Bucket configuration
if grep -qE "your-new-s3-bucket-name|your-bucket-name" .env.production; then
    echo ""
    echo "⚠️ S3 Bucket name is not configured in .env.production yet!"
    if [ -t 0 ]; then
        read -rp "👉 Enter your new AWS S3 Bucket Name: " INPUT_BUCKET
        if [ -n "$INPUT_BUCKET" ]; then
            sed -i "s/your-new-s3-bucket-name/$INPUT_BUCKET/g" .env.production
            sed -i "s/your-bucket-name/$INPUT_BUCKET/g" .env.production
            echo "✅ Configured AWS_S3_BUCKET=$INPUT_BUCKET"
        fi
    else
        echo "⚠️ Please edit .env.production and set AWS_S3_BUCKET before accessing S3 features."
    fi
fi

# 6. Build and start containers
echo ""
echo "🏗️ Building and starting Docker containers..."
sudo docker compose -f docker-compose.yml --env-file .env.production up -d --build

# 7. Check container status
echo ""
echo "📊 Container status:"
sudo docker compose ps

echo ""
PUBLIC_ACCESS_IP=${PUBLIC_IP:-"YOUR_EC2_PUBLIC_IP"}
echo "=========================================================="
echo "🎉 DocVault Deployment Complete!"
echo "🌐 Access your app at: http://$PUBLIC_ACCESS_IP"
echo "🔍 Check backend logs: sudo docker compose logs -f backend"
echo "🔍 Check frontend logs: sudo docker compose logs -f frontend"
echo "=========================================================="
