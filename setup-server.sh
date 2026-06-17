#!/bin/bash
# Cup2Cup Server Setup Script
# Run this on your Debian server

set -e

echo "🚀 Cup2Cup Server Setup"
echo "======================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo "⚠️  Please don't run as root. Run as your regular user."
  exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install Node.js 20.x
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
  sudo apt install -y postgresql postgresql-contrib
  sudo systemctl enable postgresql
  sudo systemctl start postgresql
fi

# Install Redis
echo "📦 Installing Redis..."
if ! command -v redis-cli &> /dev/null; then
  sudo apt install -y redis-server
  sudo systemctl enable redis-server
  sudo systemctl start redis-server
fi

# Create project directory
echo "📁 Creating project directory..."
sudo mkdir -p /var/www/cup2cup
sudo chown $USER:$USER /var/www/cup2cup

# Clone repository
echo "📥 Cloning Cup2Cup repository..."
cd /var/www/cup2cup
if [ ! -d ".git" ]; then
  git clone https://github.com/SirJBiscuit/Cup2Cup.git .
else
  git pull origin main
fi

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Set up PostgreSQL database
echo "🗄️  Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE cup2cup_voice_chat;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER cup2cup_user WITH ENCRYPTED PASSWORD 'changeme123';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cup2cup_voice_chat TO cup2cup_user;"
sudo -u postgres psql -c "ALTER DATABASE cup2cup_voice_chat OWNER TO cup2cup_user;"

# Run database schema
echo "📊 Creating database schema..."
sudo -u postgres psql cup2cup_voice_chat < database/schema.sql 2>/dev/null || echo "Schema may already exist"

# Create .env file
echo "⚙️  Creating .env file..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✓ Created .env file - PLEASE EDIT IT WITH YOUR SETTINGS!"
else
  echo "✓ .env file already exists"
fi

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
  sudo apt install -y nginx
  sudo systemctl enable nginx
  sudo systemctl start nginx
fi

# Install Certbot
echo "📦 Installing Certbot..."
if ! command -v certbot &> /dev/null; then
  sudo apt install -y certbot python3-certbot-nginx
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit /var/www/cup2cup/.env with your configuration"
echo "2. Update database password: sudo -u postgres psql -c \"ALTER USER cup2cup_user WITH PASSWORD 'your_secure_password';\""
echo "3. Get SSL certificate: sudo certbot --nginx -d cup2cup.xyz"
echo "4. Start the server: npm run dev"
echo "5. Or use PM2: pm2 start src/server.js --name cup2cup-backend"
echo ""
