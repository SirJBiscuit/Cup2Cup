#!/bin/bash

# LiveKit Quick Setup Script for Cup2Cup
# Run this on your server to set up LiveKit voice chat

set -e

echo "🎤 Cup2Cup LiveKit Setup"
echo "========================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Generate API keys
echo "📝 Generating API keys..."
API_KEY=$(openssl rand -base64 32)
API_SECRET=$(openssl rand -base64 32)

echo ""
echo "✅ Generated API Keys:"
echo "API_KEY: $API_KEY"
echo "API_SECRET: $API_SECRET"
echo ""

# Download and install LiveKit
echo "📥 Downloading LiveKit server..."
cd /opt
wget -q https://github.com/livekit/livekit/releases/download/v1.5.2/livekit_1.5.2_linux_amd64.tar.gz
tar -xzf livekit_1.5.2_linux_amd64.tar.gz
mv livekit-server /usr/local/bin/
rm livekit_1.5.2_linux_amd64.tar.gz

# Create LiveKit user
echo "👤 Creating LiveKit user..."
useradd -r -s /bin/false livekit || true

# Create config directory
mkdir -p /etc/livekit
chown livekit:livekit /etc/livekit

# Create config file
echo "⚙️  Creating configuration..."
cat > /etc/livekit/config.yaml <<EOF
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
  
redis:
  address: localhost:6379
  
keys:
  APIKey: $API_KEY
  APISecret: $API_SECRET

room:
  auto_create: false
  empty_timeout: 300
  max_participants: 20

logging:
  level: info
  
turn:
  enabled: true
  domain: cup2cup.xyz
  tls_port: 5349
EOF

# Create systemd service
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/livekit.service <<EOF
[Unit]
Description=LiveKit Server
After=network.target redis.service

[Service]
Type=simple
User=livekit
ExecStart=/usr/local/bin/livekit-server --config /etc/livekit/config.yaml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 7880/tcp
ufw allow 50000:60000/udp
ufw allow 5349/tcp

# Start LiveKit
echo "🚀 Starting LiveKit..."
systemctl daemon-reload
systemctl enable livekit
systemctl start livekit

# Wait a moment for startup
sleep 2

# Check status
if systemctl is-active --quiet livekit; then
  echo ""
  echo "✅ LiveKit is running!"
else
  echo ""
  echo "❌ LiveKit failed to start. Check logs with: journalctl -u livekit -n 50"
  exit 1
fi

# Update .env file
echo ""
echo "📝 Updating .env file..."
cd /var/www/cup2cup

if [ -f .env ]; then
  # Update existing .env
  sed -i "s/^LIVEKIT_API_KEY=.*/LIVEKIT_API_KEY=$API_KEY/" .env
  sed -i "s/^LIVEKIT_API_SECRET=.*/LIVEKIT_API_SECRET=$API_SECRET/" .env
  sed -i "s|^LIVEKIT_URL=.*|LIVEKIT_URL=wss://cup2cup.xyz/livekit|" .env
  
  # Add if not exists
  grep -q "^LIVEKIT_API_KEY=" .env || echo "LIVEKIT_API_KEY=$API_KEY" >> .env
  grep -q "^LIVEKIT_API_SECRET=" .env || echo "LIVEKIT_API_SECRET=$API_SECRET" >> .env
  grep -q "^LIVEKIT_URL=" .env || echo "LIVEKIT_URL=wss://cup2cup.xyz/livekit" >> .env
else
  echo "❌ .env file not found at /var/www/cup2cup/.env"
  echo "Please create it and add these variables:"
  echo "LIVEKIT_API_KEY=$API_KEY"
  echo "LIVEKIT_API_SECRET=$API_SECRET"
  echo "LIVEKIT_URL=wss://cup2cup.xyz/livekit"
  exit 1
fi

# Install npm package
echo "📦 Installing livekit-server-sdk..."
npm install livekit-server-sdk

# Approve bcrypt install scripts if needed
if command -v npm-approve-scripts &> /dev/null; then
  npm approve-scripts bcrypt || true
fi

# Restart backend
echo "🔄 Restarting backend..."
if pm2 list | grep -q "cup2cup"; then
  pm2 restart all
  echo "✅ Backend restarted"
else
  echo "⚠️  PM2 process not found. Please start your backend manually:"
  echo "   cd /var/www/cup2cup"
  echo "   pm2 start src/server.js --name cup2cup-backend"
fi

echo ""
echo "✅ LiveKit Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Add this to your Nginx config:"
echo ""
echo "   location /livekit {"
echo "       proxy_pass http://localhost:7880;"
echo "       proxy_http_version 1.1;"
echo "       proxy_set_header Upgrade \$http_upgrade;"
echo "       proxy_set_header Connection \"upgrade\";"
echo "       proxy_set_header Host \$host;"
echo "       proxy_set_header X-Real-IP \$remote_addr;"
echo "       proxy_read_timeout 86400;"
echo "   }"
echo ""
echo "2. Reload Nginx: sudo systemctl reload nginx"
echo "3. Test voice chat in a room!"
echo ""
echo "🔍 Useful commands:"
echo "   - Check status: sudo systemctl status livekit"
echo "   - View logs: sudo journalctl -u livekit -f"
echo "   - Restart: sudo systemctl restart livekit"
echo ""
