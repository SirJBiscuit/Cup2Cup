# Cup2Cup Frontend Implementation Plan

## Current Status
✅ Backend is LIVE at https://cup2cup.xyz
✅ Database configured
✅ Authentication working
✅ WebRTC signaling ready

## Frontend Setup Commands (Run on Server)

```bash
cd /var/www/cup2cup

# Create React app with TypeScript
npx create-react-app client --template typescript

cd client

# Install dependencies
npm install react-router-dom socket.io-client axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install shadcn/ui components (optional, for beautiful UI)
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
```

## Project Structure

```
client/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── GuestJoin.tsx
│   │   ├── Room/
│   │   │   ├── RoomList.tsx
│   │   │   ├── CreateRoom.tsx
│   │   │   ├── VoiceRoom.tsx
│   │   │   └── ParticipantList.tsx
│   │   ├── Voice/
│   │   │   ├── AudioControls.tsx
│   │   │   ├── VolumeSlider.tsx
│   │   │   └── DeviceSelector.tsx
│   │   └── Layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── ThemeToggle.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebRTC.ts
│   │   ├── useSocket.ts
│   │   └── useAudio.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── socket.ts
│   │   └── webrtc.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── RoomContext.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── index.tsx
└── package.json
```

## Key Features to Implement

### 1. Authentication Pages
- **Login** - Username + password
- **Register** - Username, display name, password
- **Guest Join** - Display name only

### 2. Dashboard (Account Owners)
- List of user's rooms
- Create new room button
- Recent connections
- Settings link

### 3. Voice Room Interface
- **Participant grid** with audio indicators
- **Self controls** - Mute, deafen, device selection
- **Owner controls** - Kick, ban, mute others
- **Chat panel** - Text messages
- **Music player** (future)

### 4. WebRTC Implementation
- Peer-to-peer connections for ≤5 participants
- Audio streaming with Opus codec
- Adaptive quality based on participant count
- ICE candidate exchange via Socket.io

## Next Session Tasks

1. ✅ Set up React app on server
2. ✅ Configure TailwindCSS
3. ✅ Create authentication pages
4. ✅ Implement WebRTC voice chat
5. ✅ Build room interface
6. ✅ Deploy frontend to Nginx

## Notes
- Frontend will be served by Nginx from `/var/www/cup2cup/client/build`
- API calls proxy through Nginx to backend on port 3002
- WebSocket connections for Socket.io signaling
- Use HTTPS for WebRTC (required for getUserMedia)
