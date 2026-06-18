import { Room, RoomEvent, RemoteParticipant, Track } from 'livekit-client';
import api from './api';

class LiveKitService {
  private room: Room | null = null;

  async connect(roomName: string, participantName: string): Promise<Room> {
    // Get token from backend
    const { data } = await api.post<{ token: string; url: string }>('/livekit/token', {
      roomName,
      participantName,
    });

    // Create room
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Connect to LiveKit server
    await this.room.connect(data.url, data.token);

    return this.room;
  }

  async enableMicrophone(): Promise<void> {
    if (this.room) {
      await this.room.localParticipant.setMicrophoneEnabled(true);
    }
  }

  async disableMicrophone(): Promise<void> {
    if (this.room) {
      await this.room.localParticipant.setMicrophoneEnabled(false);
    }
  }

  async toggleMicrophone(): Promise<boolean> {
    if (this.room) {
      const enabled = this.room.localParticipant.isMicrophoneEnabled;
      await this.room.localParticipant.setMicrophoneEnabled(!enabled);
      return !enabled;
    }
    return false;
  }

  setVolume(volume: number): void {
    if (this.room) {
      this.room.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((publication) => {
          if (publication.track && publication.track.attachedElements.length > 0) {
            publication.track.attachedElements.forEach((element: HTMLMediaElement) => {
              element.volume = volume;
            });
          }
        });
      });
    }
  }

  muteAllRemote(): void {
    this.setVolume(0);
  }

  unmuteAllRemote(): void {
    this.setVolume(1);
  }

  disconnect(): void {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
  }

  getRoom(): Room | null {
    return this.room;
  }

  onParticipantConnected(callback: (participant: RemoteParticipant) => void): void {
    if (this.room) {
      this.room.on(RoomEvent.ParticipantConnected, callback);
    }
  }

  onParticipantDisconnected(callback: (participant: RemoteParticipant) => void): void {
    if (this.room) {
      this.room.on(RoomEvent.ParticipantDisconnected, callback);
    }
  }

  onTrackSubscribed(callback: (track: Track, participant: RemoteParticipant) => void): void {
    if (this.room) {
      this.room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        callback(track, participant);
      });
    }
  }

  onDisconnected(callback: () => void): void {
    if (this.room) {
      this.room.on(RoomEvent.Disconnected, callback);
    }
  }
}

export default new LiveKitService();
