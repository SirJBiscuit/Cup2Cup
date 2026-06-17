# Cup2Cup - High-Quality Voice Chat Platform

A privacy-focused, high-quality voice chat platform with music integration.

## Features

- 🎙️ **High-Quality Voice Chat** - Adaptive quality scaling (Opus codec)
- 🎵 **Music Integration** - SoundCloud & Spotify support
- 🔐 **Hybrid Authentication** - Account owners + guest users
- 🎨 **Modern UI** - Dark/Light mode, responsive design
- 🔒 **Privacy-Focused** - No recording, end-to-end encryption
- 📱 **Cross-Platform** - Web (PWA) + Mobile apps (coming soon)

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL + Redis
- Socket.io for WebRTC signaling
- JWT authentication

**Frontend:**
- React + TypeScript
- TailwindCSS + shadcn/ui
- WebRTC for voice
- Web Audio API for mixing

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Clone repository
git clone https://github.com/SirJBiscuit/Cup2Cup.git
cd Cup2Cup

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
psql -U postgres -c "CREATE DATABASE cup2cup_voice_chat;"
psql -U postgres cup2cup_voice_chat < database/schema.sql

# Run development servers
npm run dev
```

## Project Structure

```
Cup2Cup/
├── src/              # Backend source
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── middleware/   # Auth, validation
│   └── socket/       # WebRTC signaling
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── public/
├── database/         # SQL schemas
└── docs/            # Documentation
```

## Development

```bash
# Backend (port 3000)
npm run dev

# Frontend (port 3001)
cd client && npm start
```

## Deployment

See [deployment guide](docs/DEPLOYMENT.md) for production setup.

## License

MIT

## Author

SirJBiscuit
