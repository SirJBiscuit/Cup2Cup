#!/bin/bash

# Cup2Cup Admin Panel Deployment Script
# This script safely deploys the admin panel with backups

set -e  # Exit on error

echo "🚀 Cup2Cup Admin Panel Deployment"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/cup2cup"
BACKUP_DIR="/var/backups/cup2cup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Do not run this script as root!${NC}"
   echo "Run as: ./deploy-admin.sh"
   exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment checks...${NC}"

# Check if in correct directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# Check if git repo
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not a git repository${NC}"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed${NC}"
    echo "Install with: npm install -g pm2"
    exit 1
fi

# Check if PostgreSQL is accessible
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL client not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"
echo ""

# Create backup directory
echo -e "${YELLOW}📁 Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✅ Backup directory ready${NC}"
echo ""

# Backup current code
echo -e "${YELLOW}💾 Creating backup of current code...${NC}"
tar -czf "$BACKUP_DIR/pre-admin-deploy-$TIMESTAMP.tar.gz" \
    --exclude='node_modules' \
    --exclude='client/node_modules' \
    --exclude='client/build' \
    --exclude='.git' \
    -C /var/www cup2cup

echo -e "${GREEN}✅ Code backup created: pre-admin-deploy-$TIMESTAMP.tar.gz${NC}"
echo ""

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code from Git...${NC}"
git fetch origin
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend npm install failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd client
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend npm install failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

cd ..

# Run database migration
echo -e "${YELLOW}🗄️  Running database migration...${NC}"
echo ""
echo "Please enter your PostgreSQL password when prompted:"
echo ""

psql -U cup2cup_user -d cup2cup -f database/add_admin_role.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database migration failed${NC}"
    echo "You may need to run it manually:"
    echo "psql -U cup2cup_user -d cup2cup -f database/add_admin_role.sql"
else
    echo -e "${GREEN}✅ Database migration completed${NC}"
fi

echo ""

# Restart PM2
echo -e "${YELLOW}🔄 Restarting server...${NC}"
pm2 restart cup2cup-backend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ PM2 restart failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Server restarted${NC}"
echo ""

# Wait for server to start
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
sleep 5

# Check if server is running
if pm2 list | grep -q "cup2cup-backend.*online"; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server may not be running properly${NC}"
    echo "Check logs with: pm2 logs cup2cup-backend"
fi

echo ""
echo "=================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Access admin panel at: https://cup2cup.xyz/admin"
echo "2. Login with default credentials:"
echo "   Username: admin"
echo "   Password: Admin123!"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Change the default password immediately!${NC}"
echo ""
echo "3. Test the admin features:"
echo "   - View dashboard stats"
echo "   - Create a backup"
echo "   - Test restart (optional)"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide: ADMIN_SETUP.md"
echo "   - Deployment Guide: DEPLOYMENT_GUIDE.md"
echo "   - Troubleshooting: TROUBLESHOOTING.md"
echo ""
echo "🔍 Useful Commands:"
echo "   - View logs: pm2 logs cup2cup-backend"
echo "   - Check status: pm2 status"
echo "   - Monitor: pm2 monit"
echo ""
echo "💾 Backup Location:"
echo "   $BACKUP_DIR/pre-admin-deploy-$TIMESTAMP.tar.gz"
echo ""
echo -e "${GREEN}✨ Happy deploying!${NC}"
