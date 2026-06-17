import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { query } from '../config/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Generate random phrase code
const generatePhraseCode = () => {
  const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel'];
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${word1}-${word2}-${num}`;
};

// Create room
router.post('/create', optionalAuth, async (req, res) => {
  try {
    const { isPersistent = true, password, maxParticipants = 10 } = req.body;
    
    // Guests can only create temporary rooms
    const isGuest = !req.user;
    const actuallyPersistent = isGuest ? false : isPersistent;
    
    let phraseCode = generatePhraseCode();
    let attempts = 0;
    
    while (attempts < 10) {
      const existing = await query(
        'SELECT id FROM phrase_codes WHERE phrase_code = $1',
        [phraseCode]
      );
      
      if (existing.rows.length === 0) break;
      phraseCode = generatePhraseCode();
      attempts++;
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const expiresAt = actuallyPersistent ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const ownerId = req.user ? req.user.id : null;

    const result = await query(
      `INSERT INTO phrase_codes (owner_id, phrase_code, is_persistent, password_hash, max_participants, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, phrase_code, is_persistent, max_participants, created_at`,
      [ownerId, phraseCode, actuallyPersistent, passwordHash, maxParticipants, expiresAt]
    );

    res.status(201).json({ room: result.rows[0] });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get user's rooms
router.get('/my-rooms', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, phrase_code, is_persistent, max_participants, created_at, last_activity
       FROM phrase_codes
       WHERE owner_id = $1
       ORDER BY last_activity DESC`,
      [req.user.id]
    );

    res.json({ rooms: result.rows });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// Get room info
router.get('/:phraseCode', optionalAuth, async (req, res) => {
  try {
    const { phraseCode } = req.params;

    const result = await query(
      `SELECT pc.id, pc.phrase_code, pc.is_persistent, pc.max_participants,
              pc.password_hash IS NOT NULL as has_password,
              u.username as owner_username, u.display_name as owner_display_name,
              u.soundcloud_connected, u.spotify_connected
       FROM phrase_codes pc
       JOIN users u ON u.id = pc.owner_id
       WHERE pc.phrase_code = $1`,
      [phraseCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = result.rows[0];
    delete room.password_hash;

    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Verify room password
router.post('/:phraseCode/verify', async (req, res) => {
  try {
    const { phraseCode } = req.params;
    const { password } = req.body;

    const result = await query(
      'SELECT password_hash FROM phrase_codes WHERE phrase_code = $1',
      [phraseCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = result.rows[0];

    if (!room.password_hash) {
      return res.json({ valid: true });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const valid = await bcrypt.compare(password, room.password_hash);
    res.json({ valid });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

// Delete room
router.delete('/:phraseCode', authenticateToken, async (req, res) => {
  try {
    const { phraseCode } = req.params;

    const result = await query(
      'DELETE FROM phrase_codes WHERE phrase_code = $1 AND owner_id = $2 RETURNING id',
      [phraseCode, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found or unauthorized' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
