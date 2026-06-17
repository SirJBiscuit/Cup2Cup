import { io, Socket } from 'socket.io-client';
import type { Participant, ChatMessage, JoinRoomData } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('✓ Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('✗ Socket disconnected');
      });

      this.socket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(data: JoinRoomData): void {
    this.socket?.emit('join-room', data);
  }

  leaveRoom(phraseCode: string): void {
    this.socket?.emit('leave-room', { phraseCode });
  }

  sendChatMessage(phraseCode: string, message: string): void {
    this.socket?.emit('chat-message', { phraseCode, message });
  }

  sendOffer(offer: RTCSessionDescriptionInit, targetSocketId: string): void {
    this.socket?.emit('offer', { offer, targetSocketId });
  }

  sendAnswer(answer: RTCSessionDescriptionInit, targetSocketId: string): void {
    this.socket?.emit('answer', { answer, targetSocketId });
  }

  sendICECandidate(candidate: RTCIceCandidate, targetSocketId: string): void {
    this.socket?.emit('ice-candidate', { candidate, targetSocketId });
  }

  onJoinedRoom(callback: (data: { phraseCode: string; participants: Participant[] }) => void): void {
    this.socket?.on('joined-room', callback);
  }

  onRoomParticipants(callback: (data: { participants: Participant[] }) => void): void {
    this.socket?.on('room-participants', callback);
  }

  onChatMessage(callback: (data: ChatMessage) => void): void {
    this.socket?.on('chat-message', callback);
  }

  onOffer(callback: (data: { offer: RTCSessionDescriptionInit; fromSocketId: string }) => void): void {
    this.socket?.on('offer', callback);
  }

  onAnswer(callback: (data: { answer: RTCSessionDescriptionInit; fromSocketId: string }) => void): void {
    this.socket?.on('answer', callback);
  }

  onICECandidate(callback: (data: { candidate: RTCIceCandidate; fromSocketId: string }) => void): void {
    this.socket?.on('ice-candidate', callback);
  }

  onError(callback: (error: { message: string }) => void): void {
    this.socket?.on('error', callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();
