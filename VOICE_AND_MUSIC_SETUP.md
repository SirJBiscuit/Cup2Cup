# Voice Chat & Music Integration Setup Guide

## ✅ Fixed Issues

### 1. Room Leave Redirect
**Status:** ✅ FIXED
- Changed from checking `token` to `accessToken` in localStorage
- Now properly redirects to `/dashboard` for logged-in users
- Redirects to `/` for guests

## 🎤 Voice Chat Setup (LiveKit)

**Status:** ⚠️ Needs Server Configuration

The voice chat is fully implemented using LiveKit but requires server-side configuration.

### Required Environment Variables

Add these to your `.env` file on the server:

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

### How to Get LiveKit Credentials

1. Go to https://livekit.io/
2. Sign up for a free account
3. Create a new project
4. Copy the WebSocket URL, API Key, and API Secret
5. Add them to your `.env` file

### LiveKit Route

The backend route `/api/livekit/token` needs to be implemented to generate tokens:

```javascript
// src/routes/livekit.js
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/token', authenticateToken, async (req, res) => {
  try {
    const { roomName, participantName } = req.body;

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: participantName,
      }
    );

    at.addGrant({ roomJoin: true, room: roomName });

    const token = at.toJwt();

    res.json({
      token,
      url: process.env.LIVEKIT_URL,
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    res.status(503).json({ error: 'Voice chat unavailable' });
  }
});

export default router;
```

### Install LiveKit SDK

```bash
npm install livekit-server-sdk
```

### Register the Route

In `src/server.js`:

```javascript
import livekitRoutes from './routes/livekit.js';
app.use('/api/livekit', livekitRoutes);
```

## 🎵 Music Integration Setup

**Status:** ⚠️ Needs Implementation

### Spotify OAuth Setup

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Add redirect URI: `https://cup2cup.xyz/api/music/spotify/callback`
4. Copy Client ID and Client Secret

Add to `.env`:

```bash
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://cup2cup.xyz/api/music/spotify/callback
```

### SoundCloud OAuth Setup

1. Go to https://soundcloud.com/you/apps
2. Register a new app
3. Add redirect URI: `https://cup2cup.xyz/api/music/soundcloud/callback`
4. Copy Client ID and Client Secret

Add to `.env`:

```bash
SOUNDCLOUD_CLIENT_ID=your_client_id
SOUNDCLOUD_CLIENT_SECRET=your_client_secret
SOUNDCLOUD_REDIRECT_URI=https://cup2cup.xyz/api/music/soundcloud/callback
```

### Implementation Needed

The music routes in `src/routes/music.js` are currently placeholders. Full OAuth implementation is needed for:

- Spotify authorization flow
- SoundCloud authorization flow
- Token refresh handling
- Music queue management
- Playback synchronization

## 🚀 Deployment Steps

1. **Install dependencies:**
   ```bash
   cd /var/www/cup2cup
   npm install livekit-server-sdk
   ```

2. **Update .env file with all credentials**

3. **Create LiveKit route file**

4. **Register LiveKit route in server.js**

5. **Restart backend:**
   ```bash
   pm2 restart cup2cup-backend
   ```

6. **Build frontend:**
   ```bash
   cd client
   npm run build
   ```

## ✅ Summary

- ✅ Room leave redirect fixed
- ⚠️ Voice chat implemented but needs LiveKit server configuration
- ⚠️ Music integration needs OAuth implementation
- 📝 All code is in place, just needs environment variables and deployment

The app will work without voice chat (graceful degradation), but users will see "Voice chat unavailable" message.
