#!/bin/bash

# Jitsi Meet Custom Server Setup for Cup2Cup
# Domain: meet.cup2cup.xyz

set -e

echo "🎤 Jitsi Meet Custom Server Setup"
echo "==================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

JITSI_DOMAIN="meet.cup2cup.xyz"
PUBLIC_IP=$(curl -s ifconfig.me)

echo "📦 Installing Jitsi Meet"
echo "   Domain: $JITSI_DOMAIN"
echo "   Server IP: $PUBLIC_IP"
echo ""
echo "⚠️  BEFORE CONTINUING:"
echo "   1. Add DNS A record: meet.cup2cup.xyz → $PUBLIC_IP"
echo "   2. Wait for DNS to propagate (check with: dig meet.cup2cup.xyz)"
echo ""
read -p "Press Enter when DNS is ready..."

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Set hostname
echo "🔧 Setting hostname..."
hostnamectl set-hostname $JITSI_DOMAIN
echo "127.0.0.1 localhost" > /etc/hosts
echo "$PUBLIC_IP $JITSI_DOMAIN" >> /etc/hosts

# Install dependencies
echo "📦 Installing dependencies..."
apt install -y apt-transport-https gnupg2 nginx-full curl

# Add Jitsi repository
echo "📦 Adding Jitsi repository..."
curl -sL https://download.jitsi.org/jitsi-key.gpg.key | gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/" > /etc/apt/sources.list.d/jitsi-stable.list
apt update

# Pre-configure Jitsi
echo "🔧 Pre-configuring Jitsi..."
echo "jitsi-videobridge jitsi-videobridge/jvb-hostname string $JITSI_DOMAIN" | debconf-set-selections
echo "jitsi-meet-web-config jitsi-meet/cert-choice select Generate a new self-signed certificate" | debconf-set-selections

# Install Jitsi Meet
echo "📦 Installing Jitsi Meet (this may take a few minutes)..."
DEBIAN_FRONTEND=noninteractive apt install -y jitsi-meet

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 10000/udp
ufw allow 4443/tcp
ufw allow 22/tcp
ufw --force enable

# Install Let's Encrypt certificate
echo "🔒 Installing SSL certificate..."
echo "$JITSI_DOMAIN" | /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh

# Configure Jitsi for Cup2Cup
echo "⚙️  Configuring Jitsi for Cup2Cup..."

# Backup original config
cp /etc/jitsi/meet/${JITSI_DOMAIN}-config.js /etc/jitsi/meet/${JITSI_DOMAIN}-config.js.backup

# Add Cup2Cup customizations
cat >> /etc/jitsi/meet/${JITSI_DOMAIN}-config.js << 'EOF'

// Cup2Cup Custom Configuration
config.startWithAudioMuted = false;
config.startWithVideoMuted = true;  // Audio-only by default
config.requireDisplayName = false;
config.enableWelcomePage = false;
config.prejoinPageEnabled = false;
config.disableDeepLinking = true;

// Disable video features (audio-only rooms)
config.startVideoMuted = 999;
config.disableAddingBackgroundImages = true;
config.disableVirtualBackground = true;

// Audio quality
config.audioQuality = {
    stereo: false,
    opusMaxAverageBitrate: 64000
};

// Disable unnecessary features
config.disableInviteFunctions = true;
config.doNotStoreRoom = true;
config.enableClosePage = false;

// Branding
config.defaultLocalDisplayName = 'Me';
config.defaultRemoteDisplayName = 'User';

// Toolbar - minimal controls
config.toolbarButtons = [
    'microphone',
    'hangup',
    'settings',
    'raisehand',
    'stats'
];

// Disable recording
config.disableRecording = true;
config.fileRecordingsEnabled = false;
config.liveStreamingEnabled = false;

// Performance
config.channelLastN = 20;
config.startBitrate = "800";
EOF

# Configure videobridge for NAT
echo "🔧 Configuring videobridge..."
cat >> /etc/jitsi/videobridge/sip-communicator.properties << EOF

# NAT configuration
org.ice4j.ice.harvest.NAT_HARVESTER_LOCAL_ADDRESS=$(hostname -I | awk '{print $1}')
org.ice4j.ice.harvest.NAT_HARVESTER_PUBLIC_ADDRESS=$PUBLIC_IP

# Performance tuning
org.jitsi.videobridge.ENABLE_STATISTICS=true
org.jitsi.videobridge.STATISTICS_TRANSPORT=muc
EOF

# Configure Prosody (XMPP server)
echo "🔧 Configuring Prosody..."
cat >> /etc/prosody/conf.avail/${JITSI_DOMAIN}.cfg.lua << 'EOF'

-- Cup2Cup optimizations
consider_bosh_secure = true
cross_domain_bosh = true
EOF

# Restart all services
echo "🔄 Restarting services..."
systemctl restart prosody
systemctl restart jicofo
systemctl restart jitsi-videobridge2
systemctl restart nginx

# Enable services on boot
systemctl enable prosody
systemctl enable jicofo
systemctl enable jitsi-videobridge2
systemctl enable nginx

# Test services
echo ""
echo "🧪 Testing services..."
sleep 3

if systemctl is-active --quiet prosody && \
   systemctl is-active --quiet jicofo && \
   systemctl is-active --quiet jitsi-videobridge2; then
    echo "✅ All services running!"
else
    echo "⚠️  Some services may not be running. Check with:"
    echo "   systemctl status prosody jicofo jitsi-videobridge2"
fi

echo ""
echo "✅ Jitsi Meet installation complete!"
echo ""
echo "📋 Server Details:"
echo "   URL: https://$JITSI_DOMAIN"
echo "   IP: $PUBLIC_IP"
echo ""
echo "🔧 Service Commands:"
echo "   Status: systemctl status jitsi-videobridge2"
echo "   Logs: journalctl -u jitsi-videobridge2 -f"
echo "   Restart: systemctl restart jicofo jitsi-videobridge2 prosody"
echo ""
echo "📝 Configuration Files:"
echo "   Config: /etc/jitsi/meet/${JITSI_DOMAIN}-config.js"
echo "   Videobridge: /etc/jitsi/videobridge/sip-communicator.properties"
echo "   Prosody: /etc/prosody/conf.avail/${JITSI_DOMAIN}.cfg.lua"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test: Visit https://$JITSI_DOMAIN"
echo "   2. Update Cup2Cup frontend:"
echo "      cd /var/www/cup2cup/client"
echo "      echo 'VITE_JITSI_DOMAIN=meet.cup2cup.xyz' > .env"
echo "      npm run build"
echo "   3. Restart backend: pm2 restart cup2cup-backend"
echo ""
echo "🎉 Your custom Jitsi server is ready!"
