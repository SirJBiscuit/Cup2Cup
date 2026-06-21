#!/bin/bash

# Jitsi Meet Server Setup Script for Debian
# This script installs and configures Jitsi Meet on cup2cup.xyz/meet

set -e

echo "🎤 Jitsi Meet Server Setup for Cup2Cup"
echo "======================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

JITSI_DOMAIN="cup2cup.xyz"
JITSI_PATH="/meet"

echo "📦 Installing Jitsi Meet on: https://${JITSI_DOMAIN}${JITSI_PATH}"
echo ""

# Update system
echo "📦 Updating system packages..."
apt update
apt upgrade -y

# Set hostname
echo "🔧 Setting hostname..."
hostnamectl set-hostname $JITSI_DOMAIN
echo "127.0.0.1 localhost $JITSI_DOMAIN" > /etc/hosts

# Install dependencies
echo "📦 Installing dependencies..."
apt install -y apt-transport-https gnupg2 nginx-full

# Add Jitsi repository
echo "📦 Adding Jitsi repository..."
curl -sL https://download.jitsi.org/jitsi-key.gpg.key | gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/" > /etc/apt/sources.list.d/jitsi-stable.list

# Update package list
apt update

# Pre-configure Jitsi
echo "🔧 Pre-configuring Jitsi..."
echo "jitsi-videobridge jitsi-videobridge/jvb-hostname string $JITSI_DOMAIN" | debconf-set-selections
echo "jitsi-meet-web-config jitsi-meet/cert-choice select Generate a new self-signed certificate" | debconf-set-selections

# Install Jitsi Meet
echo "📦 Installing Jitsi Meet..."
DEBIAN_FRONTEND=noninteractive apt install -y jitsi-meet

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 10000/udp
ufw allow 22/tcp
ufw --force enable

# Install Let's Encrypt certificate
echo "🔒 Setting up SSL certificate..."
echo ""
echo "⚠️  Make sure DNS for $JITSI_DOMAIN points to this server!"
read -p "Press Enter to continue with Let's Encrypt setup..."

/usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh

# Configure Jitsi for better performance
echo "⚙️  Configuring Jitsi..."

# Enable lobby (optional)
cat >> /etc/jitsi/meet/${JITSI_DOMAIN}-config.js << 'EOF'

// Custom Cup2Cup configurations
config.startWithAudioMuted = false;
config.startWithVideoMuted = true;
config.requireDisplayName = true;
config.enableWelcomePage = false;
config.prejoinPageEnabled = false;
config.disableDeepLinking = true;

// Disable video by default (audio-only)
config.startVideoMuted = 10;

// Better audio quality
config.audioQuality = {
    stereo: false,
    opusMaxAverageBitrate: 64000
};

// Branding
config.defaultLocalDisplayName = 'Guest';
config.defaultRemoteDisplayName = 'Participant';
EOF

# Configure videobridge for better NAT traversal
cat >> /etc/jitsi/videobridge/sip-communicator.properties << EOF

# NAT configuration
org.ice4j.ice.harvest.NAT_HARVESTER_LOCAL_ADDRESS=$(hostname -I | awk '{print $1}')
org.ice4j.ice.harvest.NAT_HARVESTER_PUBLIC_ADDRESS=$(curl -s ifconfig.me)
EOF

# Restart services
echo "🔄 Restarting Jitsi services..."
systemctl restart jicofo
systemctl restart jitsi-videobridge2
systemctl restart prosody

# Enable services
systemctl enable jicofo
systemctl enable jitsi-videobridge2
systemctl enable prosody

echo ""
echo "✅ Jitsi Meet installation complete!"
echo ""
echo "📋 Server Details:"
echo "   Domain: https://$JITSI_DOMAIN"
echo "   Status: systemctl status jitsi-videobridge2"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update your DNS to point $JITSI_DOMAIN to this server"
echo "   2. Update Cup2Cup frontend to use: $JITSI_DOMAIN"
echo "   3. Test by visiting: https://$JITSI_DOMAIN"
echo ""
echo "📝 Configuration files:"
echo "   - /etc/jitsi/meet/${JITSI_DOMAIN}-config.js"
echo "   - /etc/jitsi/videobridge/sip-communicator.properties"
echo "   - /etc/prosody/conf.avail/${JITSI_DOMAIN}.cfg.lua"
echo ""
echo "🎉 Your Jitsi server is ready!"
