# LiveKit Integration for Cup2Cup

## Overview
LiveKit will provide production-ready voice chat with better scalability and performance than custom WebRTC.

## Server Setup (Debian)

### 1. Install LiveKit Server

```bash
# Download LiveKit server
cd /opt
sudo wget https://github.com/livekit/livekit/releases/download/v1.5.2/livekit_1.5.2_linux_amd64.tar.gz
sudo tar -xzf livekit_1.5.2_linux_amd64.tar.gz
sudo mv livekit-server /usr/local/bin/

# Create LiveKit user
sudo useradd -r -s /bin/false livekit

# Create config directory
sudo mkdir -p /etc/livekit
sudo chown livekit:livekit /etc/livekit
```

### 2. Configure LiveKit

Create `/etc/livekit/config.yaml`:

```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
  
redis:
  address: localhost:6379
  
keys:
  # Generate with: openssl rand -base64 32
  APIKey: <your-api-key>
  APISecret: <your-api-secret>

room:
  auto_create: false
  empty_timeout: 300
  max_participants: 20

logging:
  level: info
  
turn:
  enabled: true
  domain: cup2cup.xyz
  tls_port: 5349
```

### 3. Generate API Keys

```bash
# Generate API key and secret
openssl rand -base64 32  # Use for APIKey
openssl rand -base64 32  # Use for APISecret
```

### 4. Create SystemD Service

Create `/etc/systemd/system/livekit.service`:

```ini
[Unit]
Description=LiveKit Server
After=network.target redis.service

[Service]
Type=simple
User=livekit
ExecStart=/usr/local/bin/livekit-server --config /etc/livekit/config.yaml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 5. Start LiveKit

```bash
sudo systemctl daemon-reload
sudo systemctl enable livekit
sudo systemctl start livekit
sudo systemctl status livekit
```

### 6. Configure Firewall

```bash
# Allow LiveKit ports
sudo ufw allow 7880/tcp
sudo ufw allow 50000:60000/udp
sudo ufw allow 5349/tcp
```

### 7. Nginx Reverse Proxy

Add to `/etc/nginx/sites-available/cup2cup.xyz`:

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

---

## Backend Integration

### 1. Install Dependencies

```bash
cd /var/www/cup2cup
npm install livekit-server-sdk
```

### 2. Create LiveKit Service

Create `src/services/livekit.js`:

```javascript
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://cup2cup.xyz/livekit';

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

export const createLiveKitToken = (roomName, participantName, metadata = {}) => {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
    metadata: JSON.stringify(metadata),
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return token.toJwt();
};

export const createRoom = async (roomName, options = {}) => {
  try {
    const room = await roomService.createRoom({
      name: roomName,
      emptyTimeout: options.emptyTimeout || 300,
      maxParticipants: options.maxParticipants || 20,
    });
    return room;
  } catch (error) {
    if (error.message.includes('already exists')) {
      return await roomService.getRoom(roomName);
    }
    throw error;
  }
};

export const deleteRoom = async (roomName) => {
  try {
    await roomService.deleteRoom(roomName);
  } catch (error) {
    console.error('Error deleting room:', error);
  }
};

export const listParticipants = async (roomName) => {
  try {
    const participants = await roomService.listParticipants(roomName);
    return participants;
  } catch (error) {
    console.error('Error listing participants:', error);
    return [];
  }
};
```

### 3. Add API Route

Create `src/routes/livekit.js`:

```javascript
import express from 'express';
import { createLiveKitToken, createRoom } from '../services/livekit.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get LiveKit token for joining a room
router.post('/token', optionalAuth, async (req, res) => {
  try {
    const { roomName, participantName } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'Room name and participant name required' });
    }

    // Create room if it doesn't exist
    await createRoom(roomName, {
      maxParticipants: 20,
      emptyTimeout: 300,
    });

    // Generate token
    const token = createLiveKitToken(roomName, participantName, {
      userId: req.user?.id,
      isGuest: !req.user,
    });

    res.json({
      token,
      url: process.env.LIVEKIT_URL || 'wss://cup2cup.xyz/livekit',
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    res.status(500).json({ error: 'Failed to create token' });
  }
});

export default router;
```

### 4. Register Route

In `src/server.js`:

```javascript
import livekitRoutes from './routes/livekit.js';

// ... other routes
app.use('/api/livekit', livekitRoutes);
```

### 5. Update .env

Add to `.env`:

```env
LIVEKIT_API_KEY=your-api-key-here
LIVEKIT_API_SECRET=your-api-secret-here
LIVEKIT_URL=wss://cup2cup.xyz/livekit
```

---

## Frontend Integration

### 1. Install Dependencies

```bash
cd client
npm install @livekit/components-react livekit-client
```

### 2. Create LiveKit Service

Create `client/src/services/livekit.ts`:

```typescript
import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client';
import { api } from './api';

class LiveKitService {
  private room: Room | null = null;

  async connect(roomName: string, participantName: string): Promise<Room> {
    // Get token from backend
    const { data } = await api.post<{ token: string; url: string }>('/livekit/token', {
      roomName,
      participantName,
    });

    // Create room
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Connect to LiveKit server
    await this.room.connect(data.url, data.token);

    return this.room;
  }

  async enableMicrophone(): Promise<void> {
    if (this.room) {
      await this.room.localParticipant.setMicrophoneEnabled(true);
    }
  }

  async disableMicrophone(): Promise<void> {
    if (this.room) {
      await this.room.localParticipant.setMicrophoneEnabled(false);
    }
  }

  setVolume(volume: number): void {
    if (this.room) {
      this.room.remoteParticipants.forEach((participant) => {
        participant.audioTracks.forEach((track) => {
          if (track.audioTrack) {
            track.audioTrack.setVolume(volume);
          }
        });
      });
    }
  }

  disconnect(): void {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
  }

  getRoom(): Room | null {
    return this.room;
  }
}

export default new LiveKitService();
```

### 3. Update VoiceRoom Component

Replace WebRTC initialization with LiveKit:

```typescript
import { useRoom, useParticipants } from '@livekit/components-react';
import livekitService from '../../services/livekit';

// In useEffect:
try {
  const room = await livekitService.connect(
    phraseCode!,
    isGuest && guestName ? decodeURIComponent(guestName) : 'User'
  );
  
  await livekitService.enableMicrophone();
  setVoiceEnabled(true);
} catch (error: any) {
  setMicError(error.message || 'Failed to connect to voice chat');
}
```

---

## Testing

1. Start LiveKit server
2. Restart backend with new env vars
3. Rebuild frontend
4. Join room and test voice chat
5. Open in multiple tabs/devices to test

---

## Monitoring

```bash
# Check LiveKit logs
sudo journalctl -u livekit -f

# Check active rooms
curl http://localhost:7880/rooms
```

---

## Next Steps After LiveKit Works

1. Remove custom WebRTC service
2. Add voice activity detection
3. Implement sound effects
4. Add recording capability
5. Add screen sharing (future)
