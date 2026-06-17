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
      url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    res.status(500).json({ error: error.message || 'Failed to create token' });
  }
});

export default router;
