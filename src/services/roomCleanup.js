import { query } from '../config/database.js';
import { redisClient } from '../config/redis.js';

const EMPTY_ROOM_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const CLEANUP_INTERVAL = 60 * 1000; // Run every minute

class RoomCleanupService {
  constructor() {
    this.emptyRoomTimestamps = new Map();
    this.intervalId = null;
  }

  start() {
    console.log('✓ Room cleanup service started');
    this.intervalId = setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('✗ Room cleanup service stopped');
    }
  }

  async cleanup() {
    try {
      // Get all active rooms
      const result = await query(
        `SELECT id, phrase_code FROM phrase_codes WHERE is_active = true`
      );

      for (const room of result.rows) {
        const participantCount = await this.getParticipantCount(room.phrase_code);

        if (participantCount === 0) {
          // Room is empty
          if (!this.emptyRoomTimestamps.has(room.id)) {
            // First time seeing this room empty, record the timestamp
            this.emptyRoomTimestamps.set(room.id, Date.now());
            console.log(`📭 Room ${room.phrase_code} is now empty`);
          } else {
            // Check if room has been empty long enough
            const emptyDuration = Date.now() - this.emptyRoomTimestamps.get(room.id);
            if (emptyDuration >= EMPTY_ROOM_TIMEOUT) {
              await this.deleteRoom(room);
            }
          }
        } else {
          // Room has participants, remove from empty tracking
          if (this.emptyRoomTimestamps.has(room.id)) {
            this.emptyRoomTimestamps.delete(room.id);
            console.log(`👥 Room ${room.phrase_code} has participants again`);
          }
        }
      }
    } catch (error) {
      console.error('Room cleanup error:', error);
    }
  }

  async getParticipantCount(phraseCode) {
    try {
      const participants = await redisClient.sMembers(`room:${phraseCode}:participants`);
      return participants.length;
    } catch (error) {
      console.error(`Error getting participant count for ${phraseCode}:`, error);
      return 0;
    }
  }

  async deleteRoom(room) {
    try {
      console.log(`🗑️  Deleting empty room: ${room.phrase_code}`);

      // Mark room as inactive in database
      await query(
        `UPDATE phrase_codes SET is_active = false WHERE id = $1`,
        [room.id]
      );

      // Clean up Redis data
      await redisClient.del(`room:${room.phrase_code}:participants`);
      await redisClient.del(`room:${room.phrase_code}:messages`);

      // Remove from tracking
      this.emptyRoomTimestamps.delete(room.id);

      console.log(`✓ Room ${room.phrase_code} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting room ${room.phrase_code}:`, error);
    }
  }
}

export default new RoomCleanupService();
