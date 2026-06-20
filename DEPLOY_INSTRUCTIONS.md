# 🚀 Deployment Instructions

## Quick Deploy LiveKit with Docker

Run this on your server to switch from systemd to Docker:

```bash
cd /var/www/cup2cup
git pull origin main
chmod +x deploy-livekit-docker.sh
sudo ./deploy-livekit-docker.sh
```

That's it! The script will:
- ✅ Stop the old systemd LiveKit service
- ✅ Install Docker if needed
- ✅ Sync API keys between .env and config
- ✅ Start LiveKit in Docker
- ✅ Restart your backend

## Verify It Works

```bash
# Check container
docker ps | grep livekit

# Check health
curl http://localhost:7880/

# View logs
docker logs -f livekit-server

# Test voice chat
# Go to your website and join a room - voice chat should work!
```

## Why This Fixes the Issue

The systemd LiveKit was having API key authentication problems. Docker provides:
- Isolated environment
- Official LiveKit image
- Consistent configuration
- Better debugging

## What Changed

1. **LiveKit now runs in Docker** instead of systemd
2. **Redis connection** uses `host.docker.internal:6379`
3. **API keys** are synced automatically
4. **Backend** connects to `http://localhost:7880`

## Useful Commands

```bash
# View logs
docker logs -f livekit-server

# Restart
docker-compose -f docker-compose.livekit.yml restart

# Stop
docker-compose -f docker-compose.livekit.yml down

# Start
docker-compose -f docker-compose.livekit.yml up -d

# Update to latest
docker-compose -f docker-compose.livekit.yml pull
docker-compose -f docker-compose.livekit.yml up -d
```

## Troubleshooting

If voice chat still doesn't work:

1. **Check Docker logs:**
   ```bash
   docker logs livekit-server
   ```

2. **Check backend logs:**
   ```bash
   pm2 logs cup2cup-backend | grep -i livekit
   ```

3. **Verify keys match:**
   ```bash
   grep LIVEKIT_API_KEY .env
   grep APIKey livekit-config.yaml
   ```

4. **Test LiveKit directly:**
   ```bash
   curl http://localhost:7880/
   ```

5. **Check browser console** for errors (F12)

## Full Documentation

See `LIVEKIT_DOCKER_SETUP.md` for complete documentation.

## Next Steps

After deployment:
1. Test voice chat in a room
2. Monitor logs for any errors
3. Enjoy working voice chat! 🎤
