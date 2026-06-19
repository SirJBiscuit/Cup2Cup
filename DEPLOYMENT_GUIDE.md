# Cup2Cup Deployment Guide

## 🚀 Quick Start Commands

### Backend Server (Root Directory)
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production server
npm start
```

### Frontend Client (Client Directory)
```bash
# Navigate to client
cd client

# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build
```

## 📦 Installation Steps

### 1. Backend Setup

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd cup2cup

# Install backend dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or vim .env
```

**Required Environment Variables:**
```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cup2cup

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (your frontend URL)
CORS_ORIGIN=http://your-domain.com

# Optional: LiveKit
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
LIVEKIT_WS_URL=ws://localhost:7880
```

### 2. Database Setup

```bash
# Install PostgreSQL (if not installed)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE cup2cup;
CREATE USER cup2cup_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cup2cup TO cup2cup_user;
\q

# Run schema
psql -U cup2cup_user -d cup2cup -f database/schema.sql
```

### 3. Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit with your backend URL
nano .env
```

**Frontend Environment Variables:**
```env
REACT_APP_API_URL=http://your-domain.com:3000
REACT_APP_WS_URL=ws://your-domain.com:3000
```

### 4. Build Frontend for Production

```bash
# In client directory
npm run build

# This creates a 'build' folder with optimized production files
```

## 🔧 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### Production Mode

**Option 1: Separate Servers**

Backend:
```bash
npm start
```

Frontend (serve build folder):
```bash
cd client
npm install -g serve
serve -s build -p 3001
```

**Option 2: Backend Serves Frontend**

Add to `src/server.js`:
```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});
```

Then:
```bash
# Build frontend
cd client && npm run build && cd ..

# Start backend (serves frontend too)
npm start
```

## 🐳 Docker Deployment (Recommended)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY package*.json ./
RUN npm install --production

# Copy backend source
COPY src ./src
COPY database ./database

# Build frontend
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install
COPY client ./
RUN npm run build

# Back to root
WORKDIR /app

EXPOSE 3000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: cup2cup
      POSTGRES_USER: cup2cup_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://cup2cup_user:${DB_PASSWORD}@postgres:5432/cup2cup
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

Run with Docker:
```bash
docker-compose up -d
```

## 🔒 Security Hardening

### 1. Use Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name cup2cup

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

### 2. Setup Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 3. SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## 🐛 Troubleshooting

### "Missing script: dev" Error

**Problem:** You're in the client directory trying to run backend command.

**Solution:**
```bash
# For backend (root directory):
npm run dev

# For frontend (client directory):
npm start
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U cup2cup_user -d cup2cup
```

### NPM Vulnerabilities

```bash
# Fix non-breaking issues
npm audit fix

# Check what would be fixed
npm audit fix --dry-run

# Force fix (may cause breaking changes)
npm audit fix --force
```

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# For client
cd client
rm -rf node_modules package-lock.json
npm install
```

## 📊 Monitoring

### Check Application Status

```bash
# PM2 status
pm2 status

# View logs
pm2 logs cup2cup

# Monitor resources
pm2 monit
```

### Database Monitoring

```bash
# Connect to database
psql -U cup2cup_user -d cup2cup

# Check active connections
SELECT * FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('cup2cup'));
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Update backend dependencies
npm install

# Update frontend dependencies
cd client
npm install

# Rebuild frontend
npm run build
cd ..

# Restart application
pm2 restart cup2cup
```

### Database Migrations

```bash
# Backup database first
pg_dump -U cup2cup_user cup2cup > backup_$(date +%Y%m%d).sql

# Run migration
psql -U cup2cup_user -d cup2cup -f database/migrations/001_add_admin.sql
```

### Cleanup Old Data

```bash
# Connect to database
psql -U cup2cup_user -d cup2cup

# Clean expired rooms
SELECT cleanup_expired_rooms();

# Delete old connections
DELETE FROM connections WHERE disconnected_at < NOW() - INTERVAL '30 days';
```

## 📝 Useful Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# List running processes
ps aux | grep node

# Check disk space
df -h

# Check memory usage
free -m

# View system logs
journalctl -u cup2cup -f

# Restart nginx
sudo systemctl restart nginx

# Check nginx configuration
sudo nginx -t
```

## 🎯 Performance Optimization

### Enable Compression

Add to `src/server.js`:
```javascript
import compression from 'compression';
app.use(compression());
```

### Setup Redis Caching

```javascript
import redis from './config/redis.js';

// Cache frequently accessed data
app.get('/api/rooms', async (req, res) => {
  const cached = await redis.get('rooms:list');
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const rooms = await getRooms();
  await redis.setex('rooms:list', 60, JSON.stringify(rooms));
  res.json(rooms);
});
```

### Database Connection Pooling

Already configured in `src/config/database.js` with proper pool settings.

---

## 📞 Support

For issues:
1. Check logs: `pm2 logs cup2cup`
2. Check database: `psql -U cup2cup_user -d cup2cup`
3. Review environment variables
4. Check firewall settings
5. Verify ports are open

**Common Ports:**
- Backend: 3000
- Frontend: 3001
- PostgreSQL: 5432
- Redis: 6379
- LiveKit: 7880

---

**Good luck with your deployment! 🚀**
