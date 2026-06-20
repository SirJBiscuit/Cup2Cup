# 🐳 LiveKit Docker Setup

This guide will help you deploy LiveKit using Docker instead of systemd, which should resolve the API key authentication issues.

## Why Docker?

- ✅ Consistent environment across all systems
- ✅ Easier to manage and update
- ✅ Isolated from system configuration issues
- ✅ Official LiveKit Docker image
- ✅ Better logging and monitoring

## Prerequisites

- Docker and docker-compose (script will install if missing)
- Sudo access
- Port 7880 available

## Quick Deployment

### 1. Upload Files to Server

Make sure these files are on your server in `/var/www/cup2cup`:
- `docker-compose.livekit.yml`
- `livekit-config.yaml`
- `deploy-livekit-docker.sh`

### 2. Run Deployment Script

```bash
cd /var/www/cup2cup
chmod +x deploy-livekit-docker.sh
sudo ./deploy-livekit-docker.sh
```

The script will:
1. Stop the systemd LiveKit service
2. Install Docker if needed
3. Generate or sync API keys
4. Start LiveKit in Docker
5. Restart your backend

### 3. Verify It's Working

```bash
# Check container is running
docker ps | grep livekit

# Check LiveKit health
curl http://localhost:7880/

# View logs
docker logs -f livekit-server

# Test from backend
pm2 logs cup2cup-backend | grep -i livekit
```

### 4. Test Voice Chat

1. Join a room on your website
2. Voice chat should now be available!
3. Check browser console for any errors

## Manual Deployment (Alternative)

If you prefer to run commands manually:

```bash
# Stop systemd service
sudo systemctl stop livekit
sudo systemctl disable livekit

# Navigate to project
cd /var/www/cup2cup

# Start LiveKit with Docker
docker-compose -f docker-compose.livekit.yml up -d

# Check status
docker ps | grep livekit
docker logs livekit-server

# Restart backend
pm2 restart cup2cup-backend --update-env
```

## Configuration

### API Keys

Keys are stored in two places:
1. `.env` file - Used by your backend
2. `livekit-config.yaml` - Used by LiveKit Docker container

The deployment script keeps them in sync automatically.

### Redis Connection

The Docker container connects to Redis using `host.docker.internal:6379`, which allows the container to access services running on the host machine.

### Ports

- **7880**: HTTP/WebSocket (main port)
- **7881**: TURN/TCP (for NAT traversal)
- **50000-60000**: UDP ports for RTC (media streams)

## Docker Commands

### View Logs
```bash
docker logs -f livekit-server
```

### Restart LiveKit
```bash
docker-compose -f docker-compose.livekit.yml restart
```

### Stop LiveKit
```bash
docker-compose -f docker-compose.livekit.yml down
```

### Start LiveKit
```bash
docker-compose -f docker-compose.livekit.yml up -d
```

### Update to Latest Version
```bash
docker-compose -f docker-compose.livekit.yml pull
docker-compose -f docker-compose.livekit.yml up -d
```

### View Container Stats
```bash
docker stats livekit-server
```

## Nginx Configuration

Your existing Nginx config should work without changes:

```nginx
location /livekit {
    proxy_pass http://localhost:7880;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;
}
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs livekit-server

# Check if port is in use
sudo lsof -i :7880

# Remove old container and try again
docker-compose -f docker-compose.livekit.yml down
docker-compose -f docker-compose.livekit.yml up -d
```

### API Key Errors

```bash
# Check keys match
grep LIVEKIT_API_KEY .env
grep APIKey livekit-config.yaml

# Regenerate keys
sudo ./deploy-livekit-docker.sh
```

### Can't Connect to Redis

```bash
# Check Redis is running
redis-cli ping

# Check Redis port
sudo lsof -i :6379

# Test from Docker container
docker exec livekit-server ping host.docker.internal
```

### Voice Chat Still Not Working

1. Check browser console for errors
2. Verify Nginx is proxying correctly:
   ```bash
   curl -I https://cup2cup.xyz/livekit
   ```
3. Check backend logs:
   ```bash
   pm2 logs cup2cup-backend --lines 50 | grep -i livekit
   ```
4. Verify LiveKit is responding:
   ```bash
   curl http://localhost:7880/
   ```

## Advantages Over Systemd

| Feature | Systemd | Docker |
|---------|---------|--------|
| Configuration | System-wide, can conflict | Isolated container |
| Updates | Manual binary replacement | `docker-compose pull` |
| Logs | journalctl | `docker logs` |
| Portability | System-specific | Works anywhere |
| Debugging | Harder to isolate issues | Easy to inspect |
| Rollback | Manual | Change image tag |

## Auto-Start on Boot

Docker containers with `restart: unless-stopped` will automatically start on system boot, so you don't need to configure anything extra.

## Monitoring

### Health Check Script

Create `/var/www/cup2cup/check-livekit.sh`:

```bash
#!/bin/bash
if ! docker ps | grep -q livekit-server; then
    echo "LiveKit container is not running!"
    docker-compose -f /var/www/cup2cup/docker-compose.livekit.yml up -d
fi
```

Add to crontab:
```bash
*/5 * * * * /var/www/cup2cup/check-livekit.sh
```

## Next Steps

After deployment:
1. Test voice chat in a room
2. Monitor logs for any errors
3. Check Cloudflare settings if using CDN
4. Consider setting up monitoring/alerts

## Support

If you encounter issues:
1. Check Docker logs: `docker logs livekit-server`
2. Check backend logs: `pm2 logs cup2cup-backend`
3. Verify ports are open: `sudo ufw status`
4. Test direct connection: `curl http://localhost:7880/`
