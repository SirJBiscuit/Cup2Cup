#!/bin/bash

# LiveKit Docker Deployment Script
# This script stops the systemd LiveKit service and deploys LiveKit using Docker

set -e

echo "🐳 LiveKit Docker Deployment"
echo "=============================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run with sudo"
    exit 1
fi

# Stop and disable systemd LiveKit service if it exists
echo "📦 Stopping systemd LiveKit service..."
if systemctl is-active --quiet livekit; then
    systemctl stop livekit
    echo "✓ LiveKit service stopped"
fi

if systemctl is-enabled --quiet livekit 2>/dev/null; then
    systemctl disable livekit
    echo "✓ LiveKit service disabled"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "✓ Docker installed"
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Installing..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✓ docker-compose installed"
fi

# Navigate to project directory
cd /var/www/cup2cup

# Generate new API keys if they don't exist in .env
if ! grep -q "LIVEKIT_API_KEY=" .env || [ -z "$(grep LIVEKIT_API_KEY= .env | cut -d'=' -f2)" ]; then
    echo "🔑 Generating new LiveKit API keys..."
    NEW_API_KEY=$(openssl rand -base64 32)
    NEW_API_SECRET=$(openssl rand -base64 32)
    
    # Escape special characters for sed
    ESCAPED_NEW_KEY=$(echo "$NEW_API_KEY" | sed 's/[\/&+]/\\&/g')
    ESCAPED_NEW_SECRET=$(echo "$NEW_API_SECRET" | sed 's/[\/&+]/\\&/g')
    
    # Update .env file
    sed -i "s/LIVEKIT_API_KEY=.*/LIVEKIT_API_KEY=$ESCAPED_NEW_KEY/" .env
    sed -i "s/LIVEKIT_API_SECRET=.*/LIVEKIT_API_SECRET=$ESCAPED_NEW_SECRET/" .env
    
    # Update livekit-config.yaml
    sed -i "s/APIKey:.*/APIKey: $ESCAPED_NEW_KEY/" livekit-config.yaml
    sed -i "s/APISecret:.*/APISecret: $ESCAPED_NEW_SECRET/" livekit-config.yaml
    
    echo "✓ New API keys generated and saved"
else
    echo "✓ Using existing API keys from .env"
    
    # Sync keys from .env to livekit-config.yaml
    API_KEY=$(grep LIVEKIT_API_KEY= .env | cut -d'=' -f2)
    API_SECRET=$(grep LIVEKIT_API_SECRET= .env | cut -d'=' -f2)
    
    # Escape special characters for sed
    ESCAPED_KEY=$(echo "$API_KEY" | sed 's/[\/&+]/\\&/g')
    ESCAPED_SECRET=$(echo "$API_SECRET" | sed 's/[\/&+]/\\&/g')
    
    sed -i "s/APIKey:.*/APIKey: $ESCAPED_KEY/" livekit-config.yaml
    sed -i "s/APISecret:.*/APISecret: $ESCAPED_SECRET/" livekit-config.yaml
    
    echo "✓ Keys synced between .env and livekit-config.yaml"
fi

# Update LIVEKIT_URL in .env to point to localhost (backend connects directly)
sed -i "s|LIVEKIT_URL=.*|LIVEKIT_URL=http://localhost:7880|" .env
echo "✓ LIVEKIT_URL updated to http://localhost:7880"

# Stop existing LiveKit container if running
if docker ps -a | grep -q livekit-server; then
    echo "🛑 Stopping existing LiveKit container..."
    docker-compose -f docker-compose.livekit.yml down
    echo "✓ Existing container stopped"
fi

# Pull latest LiveKit image
echo "📥 Pulling latest LiveKit image..."
docker-compose -f docker-compose.livekit.yml pull

# Start LiveKit container
echo "🚀 Starting LiveKit container..."
docker-compose -f docker-compose.livekit.yml up -d

# Wait for LiveKit to start
echo "⏳ Waiting for LiveKit to start..."
sleep 5

# Check if LiveKit is running
if docker ps | grep -q livekit-server; then
    echo "✓ LiveKit container is running"
    
    # Test LiveKit endpoint
    if curl -s http://localhost:7880/ | grep -q "OK"; then
        echo "✓ LiveKit is responding on port 7880"
    else
        echo "⚠️  LiveKit container is running but not responding yet"
    fi
else
    echo "❌ LiveKit container failed to start"
    echo "Check logs with: docker logs livekit-server"
    exit 1
fi

# Restart backend to load new environment variables
echo "🔄 Restarting backend..."
if command -v pm2 &> /dev/null; then
    pm2 restart cup2cup-backend --update-env
    echo "✓ Backend restarted"
else
    echo "⚠️  PM2 not found, please restart backend manually"
fi

echo ""
echo "✅ LiveKit Docker deployment complete!"
echo ""
echo "📊 Useful commands:"
echo "  - View logs:      docker logs -f livekit-server"
echo "  - Stop LiveKit:   docker-compose -f docker-compose.livekit.yml down"
echo "  - Start LiveKit:  docker-compose -f docker-compose.livekit.yml up -d"
echo "  - Restart:        docker-compose -f docker-compose.livekit.yml restart"
echo ""
echo "🔍 Check status:"
echo "  - Container:      docker ps | grep livekit"
echo "  - Health:         curl http://localhost:7880/"
echo "  - Backend logs:   pm2 logs cup2cup-backend | grep -i livekit"
echo ""
