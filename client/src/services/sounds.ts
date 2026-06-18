// Sound effects service for room events
class SoundService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    // Initialize sound effects
    // Note: Sound files should be placed in public/sounds/ directory
    this.loadSound('join', '/sounds/join.mp3');
    this.loadSound('leave', '/sounds/leave.mp3');
    this.loadSound('mute', '/sounds/mute.mp3');
    this.loadSound('unmute', '/sounds/unmute.mp3');
    this.loadSound('deafen', '/sounds/deafen.mp3');
    this.loadSound('undeafen', '/sounds/undeafen.mp3');
    this.loadSound('message', '/sounds/message.mp3');
  }

  private loadSound(name: string, path: string): void {
    try {
      const audio = new Audio(path);
      audio.volume = 0.5; // Default volume
      this.sounds.set(name, audio);
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }

  play(soundName: string): void {
    if (!this.enabled) return;

    const sound = this.sounds.get(soundName);
    if (sound) {
      // Clone and play to allow overlapping sounds
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.volume = sound.volume;
      clone.play().catch(err => console.warn(`Failed to play sound: ${soundName}`, err));
    }
  }

  setVolume(soundName: string, volume: number): void {
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.volume = Math.max(0, Math.min(1, volume));
    }
  }

  setGlobalVolume(volume: number): void {
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = normalizedVolume;
    });
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export default new SoundService();
