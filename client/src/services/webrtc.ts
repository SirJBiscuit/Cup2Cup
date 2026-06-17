import socketService from './socket';

interface PeerConnection {
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

class WebRTCService {
  private localStream: MediaStream | null = null;
  private peers: Map<string, PeerConnection> = new Map();
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private isDeafened: boolean = false;

  // ICE servers for NAT traversal
  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  async initialize(): Promise<MediaStream> {
    try {
      // Request microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Initialize audio context for volume control
      this.audioContext = new AudioContext();

      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw new Error('Microphone access denied');
    }
  }

  async createPeerConnection(socketId: string): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection(this.iceServers);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendICECandidate(event.candidate, socketId);
      }
    };

    // Handle incoming stream
    pc.ontrack = (event) => {
      const peerData = this.peers.get(socketId);
      if (peerData) {
        peerData.stream = event.streams[0];
        this.playRemoteStream(event.streams[0], socketId);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${socketId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.removePeer(socketId);
      }
    };

    this.peers.set(socketId, { connection: pc });
    return pc;
  }

  async createOffer(socketId: string): Promise<void> {
    try {
      const pc = await this.createPeerConnection(socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketService.sendOffer(offer, socketId);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  async handleOffer(socketId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const pc = await this.createPeerConnection(socketId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.sendAnswer(answer, socketId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  async handleAnswer(socketId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peerData = this.peers.get(socketId);
      if (peerData) {
        await peerData.connection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  async handleIceCandidate(socketId: string, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      const peerData = this.peers.get(socketId);
      if (peerData) {
        await peerData.connection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  private playRemoteStream(stream: MediaStream, socketId: string): void {
    // Create audio element for remote stream
    let audio = document.getElementById(`audio-${socketId}`) as HTMLAudioElement;
    
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = `audio-${socketId}`;
      audio.autoplay = true;
      document.body.appendChild(audio);
    }

    audio.srcObject = stream;
    
    // Apply deafen state
    audio.muted = this.isDeafened;
  }

  mute(): void {
    this.isMuted = true;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
  }

  unmute(): void {
    this.isMuted = false;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }
  }

  deafen(): void {
    this.isDeafened = true;
    // Mute all remote audio elements
    document.querySelectorAll('audio[id^="audio-"]').forEach((audio) => {
      (audio as HTMLAudioElement).muted = true;
    });
  }

  undeafen(): void {
    this.isDeafened = false;
    // Unmute all remote audio elements
    document.querySelectorAll('audio[id^="audio-"]').forEach((audio) => {
      (audio as HTMLAudioElement).muted = false;
    });
  }

  removePeer(socketId: string): void {
    const peerData = this.peers.get(socketId);
    if (peerData) {
      peerData.connection.close();
      this.peers.delete(socketId);
      
      // Remove audio element
      const audio = document.getElementById(`audio-${socketId}`);
      if (audio) {
        audio.remove();
      }
    }
  }

  disconnect(): void {
    // Close all peer connections
    this.peers.forEach((peerData, socketId) => {
      this.removePeer(socketId);
    });

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  isMicMuted(): boolean {
    return this.isMuted;
  }

  isAudioDeafened(): boolean {
    return this.isDeafened;
  }
}

export default new WebRTCService();
