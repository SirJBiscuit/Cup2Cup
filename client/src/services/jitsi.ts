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
  private domain = 'meet.jit.si'; // Can be changed to self-hosted domain
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
      await this.loadScript();

      const options = {
        roomName: config.roomName,
        width: '100%',
        height: '100%',
        parentNode: config.parentNode,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: true, // Audio only by default
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'hangup',
            'settings',
            'raisehand',
            'videoquality',
            'stats',
            'shortcuts',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#1a1a1a',
        },
        userInfo: {
          displayName: config.displayName,
        },
      };

      this.api = new window.JitsiMeetExternalAPI(this.domain, options);

      // Set up event listeners
      if (config.onReady) {
        this.api.addEventListener('videoConferenceJoined', config.onReady);
      }

      if (config.onParticipantJoined) {
        this.api.addEventListener('participantJoined', config.onParticipantJoined);
      }

      if (config.onParticipantLeft) {
        this.api.addEventListener('participantLeft', config.onParticipantLeft);
      }

      if (config.onError) {
        this.api.addEventListener('errorOccurred', config.onError);
      }

      console.log('✓ Jitsi connected');
    } catch (error) {
      console.error('Jitsi connection error:', error);
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
