// Jitsi Meet integration for voice chat
// Using Jitsi's public server (meet.jit.si) or self-hosted instance

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiConfig {
  roomName: string;
  displayName: string;
  parentNode: HTMLElement;
  onReady?: () => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onError?: (error: any) => void;
}

class JitsiService {
  private api: any = null;
  private domain = (import.meta as any).env?.VITE_JITSI_DOMAIN || 'meet.jit.si'; // Use public Jitsi server
  private scriptLoaded = false;

  async loadScript(): Promise<void> {
    if (this.scriptLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://${this.domain}/external_api.js`;
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async connect(config: JitsiConfig): Promise<void> {
    try {
      console.log('🎤 Loading Jitsi script...');
      await this.loadScript();
      console.log('✓ Jitsi script loaded');

      const options = {
        roomName: config.roomName,
        width: '100%',
        height: '100%',
        parentNode: config.parentNode,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: true,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          prejoinConfig: {
            enabled: false,
          },
          disableDeepLinking: true,
          subject: config.roomName,
          hideConferenceSubject: true,
          hideConferenceTimer: false,
          startVideoMuted: 999,
          disableVideoMute: true,
          // Force auto-join
          autoKnockLobby: false,
          enableLobbyChat: false,
          // Skip authentication
          requireDisplayName: false,
          enableInsecureRoomNameWarning: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'hangup',
            'raisehand',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DEFAULT_BACKGROUND: '#1a1a1a',
          DISABLE_VIDEO_BACKGROUND: true,
          FILM_STRIP_MAX_HEIGHT: 0,
          VERTICAL_FILMSTRIP: false,
          HIDE_INVITE_MORE_HEADER: true,
        },
        userInfo: {
          displayName: config.displayName,
          email: `${config.displayName}@cup2cup.local`, // Fake email to bypass prejoin
        },
      };

      console.log('🎤 Creating Jitsi instance for room:', config.roomName);
      this.api = new window.JitsiMeetExternalAPI(this.domain, options);
      console.log('✓ Jitsi instance created');

      // Force join the conference immediately
      setTimeout(() => {
        if (this.api) {
          console.log('🎤 Executing join command...');
          this.api.executeCommand('toggleLobby', false);
          this.api.executeCommand('startRecording', { mode: 'stream' }); // Dummy command to trigger join
        }
      }, 1000);

      // Set up event listeners - listen to multiple events for reliability
      let readyFired = false;
      
      const fireReady = () => {
        if (!readyFired && config.onReady) {
          readyFired = true;
          console.log('✓ Jitsi ready!');
          config.onReady();
        }
      };

      // These events all indicate the room is ready
      this.api.addEventListener('videoConferenceJoined', () => {
        console.log('✓ Conference joined');
        fireReady();
      });

      this.api.addEventListener('participantJoined', () => {
        console.log('✓ Participant joined');
        fireReady();
      });

      this.api.addEventListener('audioMuteStatusChanged', () => {
        console.log('✓ Audio status changed');
        fireReady();
      });

      this.api.addEventListener('readyToClose', () => {
        console.log('Jitsi ready to close');
      });

      if (config.onParticipantJoined) {
        this.api.addEventListener('participantJoined', config.onParticipantJoined);
      }

      if (config.onParticipantLeft) {
        this.api.addEventListener('participantLeft', config.onParticipantLeft);
      }

      // Listen for audio level changes to detect speaking
      this.api.addEventListener('audioLevelChanged', (data: any) => {
        const isSpeaking = data.audioLevel > 0.1; // Threshold for speaking
        console.log(`Audio level: ${data.audioLevel}, Speaking: ${isSpeaking}`);
      });

      this.api.addEventListener('errorOccurred', (error: any) => {
        console.error('❌ Jitsi error occurred:', {
          error,
          message: error?.message,
          type: error?.type,
          details: error
        });
        if (config.onError) config.onError(error);
      });

      console.log('✓ Jitsi connected, waiting for conference join...');
    } catch (error: any) {
      console.error('❌ Jitsi connection error:', {
        error,
        message: error?.message,
        stack: error?.stack,
        domain: this.domain,
        roomName: config.roomName
      });
      throw error;
    }
  }

  disconnect(): void {
    if (this.api) {
      this.api.dispose();
      this.api = null;
      console.log('✓ Jitsi disconnected');
    }
  }

  toggleAudio(): void {
    if (this.api) {
      this.api.executeCommand('toggleAudio');
    }
  }

  toggleVideo(): void {
    if (this.api) {
      this.api.executeCommand('toggleVideo');
    }
  }

  setAudioMuted(muted: boolean): void {
    if (this.api) {
      if (muted) {
        this.api.executeCommand('muteEveryone');
      } else {
        this.api.executeCommand('toggleAudio');
      }
    }
  }

  getParticipants(): Promise<any[]> {
    if (this.api) {
      return this.api.getParticipantsInfo();
    }
    return Promise.resolve([]);
  }

  isConnected(): boolean {
    return this.api !== null;
  }

  // For self-hosted Jitsi server
  setDomain(domain: string): void {
    this.domain = domain;
  }
}

export default new JitsiService();
