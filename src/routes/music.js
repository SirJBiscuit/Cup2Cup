import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Placeholder routes for music integration
// Full implementation will be added after basic functionality is working

router.get('/soundcloud/connect', authenticateToken, (req, res) => {
  res.json({ message: 'SoundCloud integration coming soon' });
});

router.get('/spotify/connect', authenticateToken, (req, res) => {
  res.json({ message: 'Spotify integration coming soon' });
});

router.get('/queue/:phraseCode', async (req, res) => {
  try {
    const { phraseCode } = req.params;
    
    const result = await query(
      `SELECT mq.* FROM music_queue mq
       JOIN phrase_codes pc ON pc.id = mq.phrase_code_id
       WHERE pc.phrase_code = $1
       ORDER BY mq.position ASC`,
      [phraseCode]
    );

    res.json({ queue: result.rows });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ error: 'Failed to get queue' });
  }
});

export default router;
