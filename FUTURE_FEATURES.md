# Cup2Cup - Future Features

## 🔊 Sound Effects System

### Overview
Add Discord-style sound effects for room events, modulated to be unique to Cup2Cup.

### Sound Events
- **Join Room** - Soft ascending chime when user joins
- **Leave Room** - Soft descending chime when user leaves
- **Mute** - Click/pop sound when muting microphone
- **Unmute** - Reverse click when unmuting
- **Deafen** - Muffled sound when deafening
- **Undeafen** - Clear sound when undeafening
- **Message Sent** - Subtle whoosh for chat messages
- **User Speaking** - Optional voice activity indicator sound

### Implementation Plan

#### 1. Sound Assets
```
client/public/sounds/
├── join.mp3
├── leave.mp3
├── mute.mp3
├── unmute.mp3
├── deafen.mp3
├── undeafen.mp3
├── message.mp3
└── speaking.mp3
```

#### 2. Sound Service
```typescript
// client/src/services/soundService.ts
class SoundService {
  private sounds: Map<string, HTMLAudioElement>;
  private enabled: boolean;
  private volume: number;

  constructor() {
    this.sounds = new Map();
    this.enabled = true;
    this.volume = 0.5;
    this.loadSounds();
  }

  private loadSounds() {
    const soundFiles = [
      'join', 'leave', 'mute', 'unmute', 
      'deafen', 'undeafen', 'message', 'speaking'
    ];
    
    soundFiles.forEach(name => {
      const audio = new Audio(`/sounds/${name}.mp3`);
      audio.volume = this.volume;
      this.sounds.set(name, audio);
    });
  }

  play(soundName: string) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(err => console.error('Sound play error:', err));
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  toggle() {
    this.enabled = !this.enabled;
  }
}

export default new SoundService();
```

#### 3. Integration Points

**VoiceRoom Component:**
```typescript
import soundService from '../../services/soundService';

// On participant join
socketService.onRoomParticipants((data) => {
  const newCount = data.participants.length;
  const oldCount = participants.length;
  
  if (newCount > oldCount) {
    soundService.play('join');
  } else if (newCount < oldCount) {
    soundService.play('leave');
  }
  
  setParticipants(data.participants);
});

// On mute toggle
const handleMuteToggle = () => {
  setIsMuted(!isMuted);
  soundService.play(isMuted ? 'unmute' : 'mute');
};

// On deafen toggle
const handleDeafenToggle = () => {
  setIsDeafened(!isDeafened);
  soundService.play(isDeafened ? 'undeafen' : 'deafen');
};

// On chat message
socketService.onChatMessage((message) => {
  setChatMessages(prev => [...prev, message]);
  soundService.play('message');
});
```

#### 4. User Settings
Add sound preferences to user settings:
```typescript
interface SoundSettings {
  enabled: boolean;
  volume: number;
  playOnJoin: boolean;
  playOnLeave: boolean;
  playOnMute: boolean;
  playOnMessage: boolean;
}
```

### Sound Creation Notes
- Use royalty-free sound libraries (Freesound, Zapsplat)
- Modulate pitch/speed to differentiate from Discord
- Keep sounds short (< 500ms)
- Use subtle, non-intrusive tones
- Test volume levels across devices

### Priority: Medium
Implement after WebRTC voice chat is working.

---

## 🎤 WebRTC Voice Chat (Next Priority)

### Implementation Steps
1. Add WebRTC peer connection setup
2. Implement getUserMedia for microphone access
3. Handle ICE candidates and signaling
4. Add audio stream management
5. Implement voice activity detection
6. Add audio quality controls

### Reference
See `.windsurf/workflows/voice-chat-implementation.md` for detailed WebRTC implementation guide.

---

## 🎵 Music Integration

### SoundCloud Integration
- OAuth connection in user settings
- Track search and playback
- Queue management with voting

### Spotify Integration
- OAuth connection in user settings
- Track search and playback
- Synchronized playback across room

### Priority: Low
Implement after voice chat is stable.
