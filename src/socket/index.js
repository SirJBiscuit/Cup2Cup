import { query } from '../config/database.js';
import redis from '../config/redis.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✓ Client connected: ${socket.id}`);

    // Join room
    socket.on('join-room', async ({ phraseCode, displayName, userId }) => {
      try {
        const roomResult = await query(
          'SELECT id, owner_id, max_participants FROM phrase_codes WHERE phrase_code = $1',
          [phraseCode]
        );

        if (roomResult.rows.length === 0) {
          return socket.emit('error', { message: 'Room not found' });
        }

        const room = roomResult.rows[0];

        // Check current participant count
        const participantCount = await redis.scard(`room:${phraseCode}:participants`);
        if (participantCount >= room.max_participants) {
          return socket.emit('error', { message: 'Room is full' });
        }

        // Add to room
        socket.join(phraseCode);
        await redis.sadd(`room:${phraseCode}:participants`, socket.id);
        await redis.hset(`participant:${socket.id}`, {
          phraseCode,
          displayName,
          userId: userId || 'guest',
          joinedAt: Date.now(),
        });

        // Log connection
        await query(
          `INSERT INTO connections (phrase_code_id, user_id, display_name, is_guest)
           VALUES ($1, $2, $3, $4)`,
          [room.id, userId || null, displayName, !userId]
        );

        // Get all participants
        const participantIds = await redis.smembers(`room:${phraseCode}:participants`);
        const participants = [];
        
        for (const id of participantIds) {
          const data = await redis.hgetall(`participant:${id}`);
          if (data.displayName) {
            participants.push({
              socketId: id,
              displayName: data.displayName,
              userId: data.userId,
            });
          }
        }

        // Notify room
        io.to(phraseCode).emit('room-participants', { participants });
        socket.emit('joined-room', { phraseCode, participants });

        console.log(`User ${displayName} joined room ${phraseCode}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave-room', async ({ phraseCode }) => {
      await leaveRoom(socket, phraseCode);
    });

    // WebRTC signaling
    socket.on('offer', ({ offer, targetSocketId }) => {
      socket.to(targetSocketId).emit('offer', {
        offer,
        fromSocketId: socket.id,
      });
    });

    socket.on('answer', ({ answer, targetSocketId }) => {
      socket.to(targetSocketId).emit('answer', {
        answer,
        fromSocketId: socket.id,
      });
    });

    socket.on('ice-candidate', ({ candidate, targetSocketId }) => {
      socket.to(targetSocketId).emit('ice-candidate', {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // Chat messages
    socket.on('chat-message', async ({ phraseCode, message }) => {
      try {
        const participantData = await redis.hgetall(`participant:${socket.id}`);
        
        if (!participantData.phraseCode || participantData.phraseCode !== phraseCode) {
          return;
        }

        const roomResult = await query(
          'SELECT id FROM phrase_codes WHERE phrase_code = $1',
          [phraseCode]
        );

        if (roomResult.rows.length > 0) {
          await query(
            `INSERT INTO chat_messages (phrase_code_id, user_id, display_name, message)
             VALUES ($1, $2, $3, $4)`,
            [
              roomResult.rows[0].id,
              participantData.userId !== 'guest' ? participantData.userId : null,
              participantData.displayName,
              message,
            ]
          );

          io.to(phraseCode).emit('chat-message', {
            displayName: participantData.displayName,
            message,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Chat message error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      try {
        const participantData = await redis.hgetall(`participant:${socket.id}`);
        
        if (participantData.phraseCode) {
          await leaveRoom(socket, participantData.phraseCode);
        }

        await redis.del(`participant:${socket.id}`);
        console.log(`✗ Client disconnected: ${socket.id}`);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });

  // Helper function to leave room
  async function leaveRoom(socket, phraseCode) {
    try {
      await redis.srem(`room:${phraseCode}:participants`, socket.id);
      socket.leave(phraseCode);

      const participantIds = await redis.smembers(`room:${phraseCode}:participants`);
      const participants = [];
      
      for (const id of participantIds) {
        const data = await redis.hgetall(`participant:${id}`);
        if (data.displayName) {
          participants.push({
            socketId: id,
            displayName: data.displayName,
            userId: data.userId,
          });
        }
      }

      io.to(phraseCode).emit('room-participants', { participants });

      // Update connection record
      const participantData = await redis.hgetall(`participant:${socket.id}`);
      if (participantData.userId && participantData.userId !== 'guest') {
        await query(
          `UPDATE connections 
           SET disconnected_at = NOW()
           WHERE user_id = $1 AND disconnected_at IS NULL`,
          [participantData.userId]
        );
      }
    } catch (error) {
      console.error('Leave room error:', error);
    }
  }
};
