import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';

let roomService = null;

// Initialize room service client
const getRoomService = () => {
  if (!roomService && LIVEKIT_API_KEY && LIVEKIT_API_SECRET) {
    roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  }
  return roomService;
};

export const createLiveKitToken = (roomName, participantName, metadata = {}) => {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit API credentials not configured');
  }

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
  const service = getRoomService();
  if (!service) {
    throw new Error('LiveKit service not initialized');
  }

  try {
    const room = await service.createRoom({
      name: roomName,
      emptyTimeout: options.emptyTimeout || 300,
      maxParticipants: options.maxParticipants || 20,
    });
    return room;
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      return await service.listRooms([roomName]).then(rooms => rooms[0]);
    }
    throw error;
  }
};

export const deleteRoom = async (roomName) => {
  const service = getRoomService();
  if (!service) return;

  try {
    await service.deleteRoom(roomName);
  } catch (error) {
    console.error('Error deleting room:', error);
  }
};

export const listParticipants = async (roomName) => {
  const service = getRoomService();
  if (!service) return [];

  try {
    const participants = await service.listParticipants(roomName);
    return participants;
  } catch (error) {
    console.error('Error listing participants:', error);
    return [];
  }
};

export const isLiveKitEnabled = () => {
  return !!(LIVEKIT_API_KEY && LIVEKIT_API_SECRET);
};
