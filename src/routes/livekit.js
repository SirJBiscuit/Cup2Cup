import express from 'express';
import { createLiveKitToken, createRoom, isLiveKitEnabled } from '../services/livekit.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Check if LiveKit is enabled
router.get('/status', (req, res) => {
  res.json({ enabled: isLiveKitEnabled() });
});

// Get LiveKit token for joining a room
router.post('/token', optionalAuth, async (req, res) => {
  try {
    if (!isLiveKitEnabled()) {
      return res.status(503).json({ error: 'LiveKit is not configured' });
    }

    const { roomName, participantName } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'Room name and participant name required' });
    }

    // Skip room creation - LiveKit auto-creates rooms
    // await createRoom(roomName, {
    //   maxParticipants: 20,
    //   emptyTimeout: 300,
    // });

    // Generate token
    const token = await createLiveKitToken(roomName, participantName, {
      userId: req.user?.id,
      isGuest: !req.user,
    });

    console.log('Generated token type:', typeof token);
    console.log('Generated token:', token);

    res.json({
      token,
      url: process.env.LIVEKIT_URL || 'wss://livekit.cup2cup.xyz',
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    res.status(500).json({ error: error.message || 'Failed to create token' });
  }
});

export default router;
