import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import pool from './config/database.js';
import redis from './config/redis.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import musicRoutes from './routes/music.js';
import { setupSocketHandlers } from './socket/index.js';
import roomCleanupService from './services/roomCleanup.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

// Trust proxy for nginx
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Disable trust proxy validation
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/music', musicRoutes);

// LiveKit routes (optional - only works if LiveKit is configured)
import livekitRoutes from './routes/livekit.js';
app.use('/api/livekit', livekitRoutes);

// Admin routes
import adminRoutes from './routes/admin.js';
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupSocketHandlers(io);

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected');

    httpServer.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Start room cleanup service
      roomCleanupService.start();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  roomCleanupService.stop();
  httpServer.close(async () => {
    await pool.end();
    await redis.quit();
    process.exit(0);
  });
});

startServer();

export { app, io };
