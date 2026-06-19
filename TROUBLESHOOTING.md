# Cup2Cup Troubleshooting Guide

## 🔥 Common Issues and Solutions

### Error: EADDRINUSE - Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3002
```

**Cause:** Another process is already using the port.

**Solutions:**

#### Option 1: Kill the Process Using the Port (Recommended)

```bash
# Find the process using port 3002
lsof -i :3002

# Or use netstat
netstat -tulpn | grep 3002

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Then restart your server
npm run dev
```

#### Option 2: Use a Different Port

```bash
# Set PORT environment variable
PORT=3000 npm run dev

# Or edit your .env file
nano .env
# Change: PORT=3000
```

#### Option 3: Stop All Node Processes

```bash
# Kill all node processes (use with caution!)
pkill -9 node

# Then restart
npm run dev
```

#### Option 4: Use PM2 to Manage Processes

```bash
# Install PM2 globally
npm install -g pm2

# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Start fresh
npm run dev
```

---

## 🐛 Other Common Issues

### Database Connection Failed

**Error:** `Failed to start server: connection refused`

**Solutions:**

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Enable auto-start on boot
sudo systemctl enable postgresql

# Test connection
psql -U cup2cup_user -d cup2cup
```

### Redis Connection Failed

**Error:** `Redis connection error`

**Solutions:**

```bash
# Check if Redis is running
sudo systemctl status redis

# Start Redis
sudo systemctl start redis

# Or install Redis if not installed
sudo apt-get install redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### Module Not Found

**Error:** `Cannot find module 'express'`

**Solutions:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear npm cache if needed
npm cache clean --force
npm install
```

### Permission Denied

**Error:** `EACCES: permission denied`

**Solutions:**

```bash
# Fix ownership of project directory
sudo chown -R $USER:$USER /var/www/cup2cup

# Fix npm permissions
sudo chown -R $USER:$USER ~/.npm

# Or run with sudo (not recommended)
sudo npm run dev
```

### Frontend Can't Connect to Backend

**Error:** `Network Error` or `Failed to fetch`

**Solutions:**

1. **Check CORS settings** in `src/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3001', // Match your frontend URL
  credentials: true,
}));
```

2. **Check proxy** in `client/package.json`:
```json
"proxy": "http://localhost:3000"
```

3. **Check environment variables** in `client/.env`:
```env
REACT_APP_API_URL=http://localhost:3000
```

### Build Fails

**Error:** `Build failed` or `Out of memory`

**Solutions:**

```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Clear build cache
rm -rf client/build
rm -rf client/node_modules/.cache

# Rebuild
cd client
npm run build
```

---

## 🔍 Debugging Commands

### Check What's Running

```bash
# List all node processes
ps aux | grep node

# Check specific port
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Check all listening ports
netstat -tulpn | grep LISTEN
```

### View Logs

```bash
# If using PM2
pm2 logs

# If using systemd
journalctl -u cup2cup -f

# Check Node logs
tail -f ~/.npm/_logs/*.log
```

### Test Connections

```bash
# Test backend API
curl http://localhost:3000/health

# Test database
psql -U cup2cup_user -d cup2cup -c "SELECT NOW();"

# Test Redis
redis-cli ping
```

---

## 🚀 Quick Fixes

### Complete Reset

```bash
# Stop everything
pm2 stop all
pm2 delete all
pkill -9 node

# Clean install
cd /var/www/cup2cup
rm -rf node_modules package-lock.json
npm install

cd client
rm -rf node_modules package-lock.json
npm install

# Restart
cd ..
npm run dev
```

### Port Conflicts

```bash
# Find and kill process on port 3000
kill -9 $(lsof -t -i:3000)

# Find and kill process on port 3001
kill -9 $(lsof -t -i:3001)

# Find and kill process on port 3002
kill -9 $(lsof -t -i:3002)
```

### Environment Issues

```bash
# Check environment variables
printenv | grep -E 'PORT|DATABASE|JWT|CORS'

# Reload environment
source .env

# Or use dotenv
npm install -g dotenv-cli
dotenv -e .env npm run dev
```

---

## 📊 Health Checks

### Verify Everything is Working

```bash
# 1. Check database
psql -U cup2cup_user -d cup2cup -c "SELECT COUNT(*) FROM users;"

# 2. Check Redis
redis-cli ping

# 3. Check backend
curl http://localhost:3000/health

# 4. Check frontend (if built)
curl http://localhost:3001

# 5. Check WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000/socket.io/
```

### Monitor Resources

```bash
# CPU and Memory usage
top

# Disk space
df -h

# Memory details
free -m

# Process details
htop
```

---

## 🔐 Security Issues

### JWT Secret Not Set

**Error:** `JWT_SECRET is not defined`

**Solution:**

```bash
# Generate secure random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env
echo "JWT_SECRET=<generated-secret>" >> .env
echo "JWT_REFRESH_SECRET=<another-generated-secret>" >> .env
```

### Database Password Issues

**Error:** `password authentication failed`

**Solution:**

```bash
# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER cup2cup_user WITH PASSWORD 'new_password';
\q

# Update .env
nano .env
# Update DATABASE_URL with new password
```

---

## 🌐 Network Issues

### Can't Access from External IP

**Solutions:**

1. **Check firewall:**
```bash
# Allow port 3000
sudo ufw allow 3000

# Check status
sudo ufw status
```

2. **Bind to 0.0.0.0:**
```javascript
// In src/server.js
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

3. **Check cloud provider security groups** (AWS, GCP, etc.)

### WebSocket Connection Failed

**Error:** `WebSocket connection failed`

**Solutions:**

1. **Check Socket.io CORS:**
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Or specific domain
    credentials: true,
  },
});
```

2. **Check nginx configuration** (if using reverse proxy)

---

## 📝 Best Practices

### Before Deploying

- [ ] Run `npm audit fix`
- [ ] Test all endpoints
- [ ] Check environment variables
- [ ] Backup database
- [ ] Test WebSocket connections
- [ ] Verify CORS settings
- [ ] Check SSL certificates
- [ ] Monitor logs

### Regular Maintenance

```bash
# Weekly: Update dependencies
npm update
cd client && npm update

# Monthly: Clean up old data
psql -U cup2cup_user -d cup2cup -c "SELECT cleanup_expired_rooms();"

# As needed: Restart services
pm2 restart all
```

---

## 🆘 Still Having Issues?

1. **Check logs:** `pm2 logs` or `journalctl -u cup2cup -f`
2. **Verify environment:** `printenv | grep -E 'PORT|DATABASE'`
3. **Test connections:** Use curl commands above
4. **Check permissions:** `ls -la /var/www/cup2cup`
5. **Review recent changes:** `git log --oneline -10`

---

**For the current EADDRINUSE error, run:**

```bash
# Quick fix
kill -9 $(lsof -t -i:3002)
npm run dev
```

**Or change the port:**

```bash
PORT=3000 npm run dev
```
