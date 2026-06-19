# 🎤 Voice Chat Quick Start

## ✅ What's Already Done

All the code for LiveKit voice chat is **already implemented**! You just need to configure the server.

## 🚀 Super Quick Setup (5 minutes)

### On Your Server

```bash
# 1. Pull latest code
cd /var/www/cup2cup
git pull origin main

# 2. Run the automated setup script
sudo bash setup-livekit.sh
```

That's it! The script will:
- ✅ Download and install LiveKit server
- ✅ Generate secure API keys
- ✅ Create systemd service
- ✅ Configure firewall
- ✅ Update your .env file
- ✅ Install npm dependencies
- ✅ Restart your backend

### Add Nginx Configuration

Add this to `/etc/nginx/sites-available/cup2cup.xyz` inside the `server` block:

```nginx
# LiveKit WebSocket
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

Then reload Nginx:

```bash
sudo systemctl reload nginx
```

### Test It!

1. Go to https://cup2cup.xyz
2. Login and create a room
3. Join the room
4. You should see "🎤 Voice chat active"
5. Open in another tab/device to test voice

## 🔍 Troubleshooting

### Check if LiveKit is running

```bash
sudo systemctl status livekit
```

### View LiveKit logs

```bash
sudo journalctl -u livekit -f
```

### Check backend logs

```bash
pm2 logs cup2cup-backend
```

### Test LiveKit directly

```bash
curl http://localhost:7880/
```

Should return LiveKit server info.

## 📝 What If Something Goes Wrong?

### LiveKit won't start

```bash
# Check the config file
sudo cat /etc/livekit/config.yaml

# Check for errors
sudo journalctl -u livekit -n 50
```

### Voice chat says "unavailable"

1. Check backend has the env vars:
   ```bash
   grep LIVEKIT /var/www/cup2cup/.env
   ```

2. Restart backend:
   ```bash
   pm2 restart cup2cup-backend
   ```

3. Check backend logs for errors:
   ```bash
   pm2 logs cup2cup-backend --lines 50
   ```

### Can't connect to voice

1. Check firewall allows ports:
   ```bash
   sudo ufw status | grep -E "7880|50000:60000|5349"
   ```

2. Check Nginx config is correct:
   ```bash
   sudo nginx -t
   ```

3. Make sure you're using HTTPS (not HTTP)

## 🎉 Success Indicators

When it's working, you'll see:

- ✅ "🎤 Voice chat active" in the room
- ✅ Mute/Unmute buttons are enabled
- ✅ Can hear other participants
- ✅ No errors in browser console (F12)

## 📚 More Info

- Full setup guide: `LIVEKIT_SETUP.md`
- LiveKit docs: https://docs.livekit.io/
- Check server status: `sudo systemctl status livekit`

## 🔧 Manual Setup

If the automated script doesn't work, follow the detailed guide in `LIVEKIT_SETUP.md`.
