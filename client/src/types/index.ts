export interface User {
  id: string;
  username: string;
  displayName: string;
  soundcloudConnected?: boolean;
  spotifyConnected?: boolean;
  theme?: 'dark' | 'light';
  preferredMusicService?: 'soundcloud' | 'spotify';
}

export interface Room {
  id: string;
  phraseCode: string;
  isPersistent: boolean;
  maxParticipants: number;
  hasPassword: boolean;
  ownerUsername?: string;
  ownerDisplayName?: string;
  soundcloudConnected?: boolean;
  spotifyConnected?: boolean;
  createdAt: string;
  lastActivity?: string;
}

export interface Participant {
  socketId: string;
  displayName: string;
  userId?: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
}

export interface ChatMessage {
  displayName: string;
  message: string;
  timestamp: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RoomCreateRequest {
  isPersistent?: boolean;
  password?: string;
  maxParticipants?: number;
}

export interface JoinRoomData {
  phraseCode: string;
  displayName: string;
  userId?: string;
  password?: string;
}
