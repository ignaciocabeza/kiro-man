import { SoundType, MusicType } from '../types';

// ZzFX - Zuper Zmall Zound Zynth
// We'll use the zzfx function directly
let zzfxV = 0.3; // volume
const zzfxX = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function zzfx(...parameters: (number | undefined)[]): AudioBufferSourceNode | undefined {
  if (!zzfxX) return;

  const params = parameters;
  const volume = params[0] !== undefined ? params[0] : 1;
  const frequency = params[2] !== undefined ? params[2] : 220;
  const attack = params[3] !== undefined ? params[3] : 0;
  const sustain = params[4] !== undefined ? params[4] : 0;
  const release = params[5] !== undefined ? params[5] : 0.1;
  const shape = params[6] !== undefined ? params[6] : 0;
  const slide = params[8] !== undefined ? params[8] : 0;
  const deltaSlide = params[9] !== undefined ? params[9] : 0;
  const pitchJump = params[10] !== undefined ? params[10] : 0;
  const pitchJumpTime = params[11] !== undefined ? params[11] : 0;
  const noise = params[13] !== undefined ? params[13] : 0;
  const sustainVolume = params[17] !== undefined ? params[17] : 1;
  const tremolo = params[19] !== undefined ? params[19] : 0;

  const sampleRate = 44100;
  const duration = attack + sustain + release;
  const length = Math.ceil(duration * sampleRate);

  if (length <= 0) return;

  const buffer = zzfxX.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let t = 0;
  let f = frequency;

  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;

    // Envelope
    let env = 1;
    if (time < attack) {
      env = time / attack;
    } else if (time < attack + sustain) {
      env = 1 - (time - attack) / sustain * (1 - sustainVolume);
    } else {
      env = sustainVolume * (1 - (time - attack - sustain) / release);
    }

    // Frequency with slide
    f = frequency * (1 + slide * time + deltaSlide * time * time);

    // Pitch jump
    if (pitchJump && time > pitchJumpTime) {
      f += pitchJump;
    }

    // Oscillator
    t += f * 2 * Math.PI / sampleRate;
    let sample = 0;

    if (shape === 0) {
      sample = Math.sin(t); // sine
    } else if (shape === 1) {
      sample = Math.sin(t) > 0 ? 1 : -1; // square
    } else if (shape === 2) {
      sample = (t / Math.PI % 2) - 1; // sawtooth
    } else {
      sample = Math.abs((t / Math.PI % 2) - 1) * 2 - 1; // triangle
    }

    // Noise
    if (noise) {
      sample += (Math.random() * 2 - 1) * noise;
    }

    // Tremolo
    if (tremolo) {
      sample *= 1 + Math.sin(time * tremolo * Math.PI * 2) * 0.5;
    }

    // Apply envelope and volume
    data[i] = sample * env * volume * zzfxV;

    // Clamp
    data[i] = Math.max(-1, Math.min(1, data[i]));
  }

  const source = zzfxX.createBufferSource();
  source.buffer = buffer;
  source.connect(zzfxX.destination);
  source.start();
  return source;
}

class AudioManager {
  private volume = 0.3;
  private muted = false;
  private previousVolume = 0.3;
  private currentMusicInterval: ReturnType<typeof setInterval> | null = null;
  private currentMusicType: MusicType | null = null;
  private musicTimeouts: ReturnType<typeof setTimeout>[] = [];

  playSound(type: SoundType): void {
    if (this.muted) return;

    try {
      // Resume audio context if suspended
      if (zzfxX && zzfxX.state === 'suspended') {
        zzfxX.resume();
      }

      switch (type) {
        case SoundType.EAT:
          zzfx(this.volume, 0, 925, 0.04, 0.3, 0.6, 1, 0.3, 0, 6.27, -184, 0.09, 0.17);
          break;
        case SoundType.PILL_EAT:
          zzfx(this.volume * 0.5, 0, 1200, 0, 0.02, 0.04, 0, 0.8, 0, 0, 0, 0, 0, 0, 0, 0);
          break;
        case SoundType.ABILITY_ACTIVATE:
          zzfx(this.volume, 0, 261, 0.01, 0.11, 0.3, 0, 0.76, 0, 0, 0, 0, 0, 0.5, 0, 0.2);
          break;
        case SoundType.COLLECTIBLE_PICKUP:
          zzfx(this.volume, 0, 783, 0.01, 0.08, 0.15, 0, 0.5, 0, 0, 0, 0, 0, 0.5);
          break;
        case SoundType.LEVEL_COMPLETE:
          zzfx(this.volume, 0, 523, 0.04, 0.2, 0.4, 1, 0.3, 0, 0, 0, 0, 0.1);
          setTimeout(() => zzfx(this.volume, 0, 659, 0.04, 0.2, 0.4, 1, 0.3), 200);
          setTimeout(() => zzfx(this.volume, 0, 784, 0.04, 0.3, 0.5, 1, 0.3), 400);
          break;
        case SoundType.GAME_OVER:
          zzfx(this.volume, 0, 200, 0.05, 0.3, 0.5, 1, 0.5, -5);
          break;
        case SoundType.ENEMY_DEATH:
          // Dramatic descending crash + explosion
          zzfx(this.volume, 0, 600, 0.02, 0.2, 0.4, 2, 0.5, -10, 0, -200, 0.1);
          setTimeout(() => zzfx(this.volume, 0, 150, 0.01, 0.15, 0.6, 3, 0.8, 0, 0, 0, 0, 0.3), 150);
          setTimeout(() => zzfx(this.volume * 0.8, 0, 80, 0.02, 0.3, 0.8, 1, 1, 0, 0, 0, 0, 0.5), 300);
          break;
        case SoundType.VICTORY:
          // Triumphant fanfare - ascending major chord arpeggio
          zzfx(this.volume, 0, 523, 0.05, 0.3, 0.5, 0, 0.3, 0, 0, 0, 0, 0.1);
          setTimeout(() => zzfx(this.volume, 0, 659, 0.05, 0.3, 0.5, 0, 0.3), 200);
          setTimeout(() => zzfx(this.volume, 0, 784, 0.05, 0.3, 0.5, 0, 0.3), 400);
          setTimeout(() => zzfx(this.volume, 0, 1047, 0.05, 0.5, 0.8, 0, 0.3), 600);
          setTimeout(() => zzfx(this.volume * 0.8, 0, 1047, 0.04, 0.2, 0.3, 1, 0.3, 0, 0, 0, 0, 0.1), 900);
          setTimeout(() => zzfx(this.volume * 0.8, 0, 1319, 0.04, 0.4, 0.8, 0, 0.3), 1100);
          break;
      }
    } catch {
      // Silently fail if audio context not available
    }
  }

  playMusic(type: MusicType): void {
    if (this.currentMusicType === type) return;
    this.stopMusic();
    this.currentMusicType = type;

    if (this.muted) return;

    try {
      if (zzfxX && zzfxX.state === 'suspended') {
        zzfxX.resume();
      }

      const notes = this.getMusicNotes(type);
      let noteIndex = 0;
      const tempo = type === MusicType.TURBO ? 150 : type === MusicType.VIBE ? 400 : type === MusicType.MENU ? 350 : type === MusicType.VICTORY ? 200 : 250;

      // Different instrument per music type
      const musicVolume = this.volume * 0.3;
      const playNote = (note: number) => {
        if (type === MusicType.MENU) {
          // Square wave for retro pac-man ghost vibe
          zzfx(musicVolume * 0.7, 0, note, 0, 0.08, 0.15, 1, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3);
        } else if (type === MusicType.VICTORY) {
          // Bright triangle wave, celebratory
          zzfx(musicVolume, 0, note, 0, 0.08, 0.15, 3, 0.5);
        } else {
          zzfx(musicVolume, 0, note, 0, 0.05, 0.1, 0, 0.5);
        }
      };

      this.currentMusicInterval = setInterval(() => {
        if (this.muted) return;
        const note = notes[noteIndex % notes.length];
        if (note > 0) {
          playNote(note);
        }
        noteIndex++;
      }, tempo);
    } catch {
      // Silently fail
    }
  }

  private getMusicNotes(type: MusicType): number[] {
    switch (type) {
      case MusicType.BACKGROUND:
        return [262, 330, 392, 330, 262, 294, 349, 294, 262, 330, 392, 523, 440, 392, 349, 330];
      case MusicType.VIBE:
        return [196, 0, 262, 0, 220, 0, 294, 0, 196, 0, 247, 0, 220, 0, 262, 0];
      case MusicType.TURBO:
        return [523, 587, 659, 698, 784, 698, 659, 587, 523, 659, 784, 880, 784, 659, 523, 659];
      case MusicType.MENU:
        // Pacman ghost-vibe: eerie minor key with ghostly pauses
        return [196, 0, 233, 0, 262, 0, 233, 0, 196, 0, 175, 0, 196, 0, 0, 0,
                147, 0, 175, 0, 196, 0, 175, 0, 147, 0, 131, 0, 147, 0, 0, 0];
      case MusicType.VICTORY:
        // Triumphant celebratory melody - major key, uplifting
        return [523, 523, 659, 784, 0, 784, 659, 784, 1047, 0, 0, 0,
                880, 784, 659, 523, 0, 659, 784, 659, 523, 0, 0, 0,
                392, 440, 523, 659, 784, 0, 880, 1047, 0, 0, 0, 0];
    }
  }

  stopMusic(): void {
    if (this.currentMusicInterval) {
      clearInterval(this.currentMusicInterval);
      this.currentMusicInterval = null;
    }
    for (const t of this.musicTimeouts) {
      clearTimeout(t);
    }
    this.musicTimeouts = [];
    this.currentMusicType = null;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    zzfxV = this.volume;
    this.previousVolume = this.volume;
  }

  getVolume(): number {
    return this.muted ? 0 : this.volume;
  }

  isMuted(): boolean {
    return this.muted;
  }

  mute(): void {
    this.muted = true;
    zzfxV = 0;
    this.stopMusic();
  }

  unmute(): void {
    this.muted = false;
    zzfxV = this.previousVolume;
  }

  toggleMute(): void {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }
}

export const audioManager = new AudioManager();
