import { AudioEventType, MusicTheme, SoundConfig, MusicConfig, VolumeSettings } from '../types/audio';

/**
 * AudioManager handles all game audio including sound effects and music
 * Integrates with Phaser's sound system
 */
export class AudioManager {
  private scene: Phaser.Scene;
  private soundEffects: Map<AudioEventType, Phaser.Sound.BaseSound>;
  private musicTracks: Map<MusicTheme, Phaser.Sound.BaseSound>;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private currentTheme: MusicTheme | null = null;
  private volumeSettings: VolumeSettings;
  private isMuted: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.soundEffects = new Map();
    this.musicTracks = new Map();
    this.volumeSettings = {
      master: 1.0,
      music: 0.7,
      sfx: 0.8,
      voice: 0.9,
    };
  }

  /**
   * Initialize audio system and load assets
   */
  initialize(): void {
    // Register sound effects
    this.registerSoundEffects();
    
    // Register music tracks
    this.registerMusicTracks();
    
    console.log('AudioManager initialized');
  }

  /**
   * Register sound effects for game events
   */
  private registerSoundEffects(): void {
    const soundConfigs: Record<AudioEventType, SoundConfig> = {
      [AudioEventType.ABILITY_PHASE]: {
        key: 'sfx_phase',
        volume: 0.8,
        loop: false,
        echoEffect: true,
      },
      [AudioEventType.ABILITY_POSSESS]: {
        key: 'sfx_possess',
        volume: 0.7,
        loop: false,
        echoEffect: true,
      },
      [AudioEventType.ABILITY_SENSE]: {
        key: 'sfx_sense',
        volume: 0.6,
        loop: false,
        echoEffect: true,
      },
      [AudioEventType.ABILITY_SPEED_BOOST]: {
        key: 'sfx_speed',
        volume: 0.7,
        loop: false,
        echoEffect: false,
      },
      [AudioEventType.COLLECTIBLE_PICKUP]: {
        key: 'sfx_pickup',
        volume: 0.5,
        loop: false,
      },
      [AudioEventType.PUZZLE_SOLVED]: {
        key: 'sfx_puzzle_solved',
        volume: 0.8,
        loop: false,
      },
      [AudioEventType.DOOR_UNLOCK]: {
        key: 'sfx_door_unlock',
        volume: 0.7,
        loop: false,
      },
      [AudioEventType.TRAP_TRIGGERED]: {
        key: 'sfx_trap',
        volume: 0.6,
        loop: false,
      },
      [AudioEventType.GUARD_PROXIMITY]: {
        key: 'sfx_guard_warning',
        volume: 0.5,
        loop: true,
      },
      [AudioEventType.DEATH]: {
        key: 'sfx_death',
        volume: 0.8,
        loop: false,
      },
      [AudioEventType.LEVEL_COMPLETE]: {
        key: 'sfx_level_complete',
        volume: 0.9,
        loop: false,
      },
      [AudioEventType.MENU_SELECT]: {
        key: 'sfx_menu_select',
        volume: 0.4,
        loop: false,
      },
      [AudioEventType.MENU_BACK]: {
        key: 'sfx_menu_back',
        volume: 0.4,
        loop: false,
      },
      [AudioEventType.HINT_USED]: {
        key: 'sfx_hint',
        volume: 0.6,
        loop: false,
      },
    };

    // Create sound instances with Web Audio API
    for (const [eventType, config] of Object.entries(soundConfigs)) {
      try {
        const sound = this.createWebAudioSound(config);
        this.soundEffects.set(eventType as AudioEventType, sound);
      } catch (error) {
        console.warn(`Failed to load sound effect: ${config.key}`, error);
      }
    }
  }

  /**
   * Register music tracks for different themes
   */
  private registerMusicTracks(): void {
    const musicConfigs: Record<MusicTheme, MusicConfig> = {
      [MusicTheme.MENU]: {
        key: 'music_menu',
        volume: 0.6,
        loop: true,
        fadeInDuration: 1000,
        fadeOutDuration: 1000,
      },
      [MusicTheme.LINEAR]: {
        key: 'music_linear',
        volume: 0.5,
        loop: true,
        fadeInDuration: 2000,
        fadeOutDuration: 2000,
      },
      [MusicTheme.SHADOW]: {
        key: 'music_shadow',
        volume: 0.4,
        loop: true,
        fadeInDuration: 2000,
        fadeOutDuration: 2000,
      },
      [MusicTheme.MEMORY]: {
        key: 'music_memory',
        volume: 0.5,
        loop: true,
        fadeInDuration: 2000,
        fadeOutDuration: 2000,
      },
      [MusicTheme.MULTI_LAYERED]: {
        key: 'music_multilayer',
        volume: 0.5,
        loop: true,
        fadeInDuration: 2000,
        fadeOutDuration: 2000,
      },
      [MusicTheme.TIME_CHANGING]: {
        key: 'music_timechange',
        volume: 0.5,
        loop: true,
        fadeInDuration: 2000,
        fadeOutDuration: 2000,
      },
      [MusicTheme.BOSS]: {
        key: 'music_boss',
        volume: 0.7,
        loop: true,
        fadeInDuration: 1000,
        fadeOutDuration: 1000,
      },
      [MusicTheme.VICTORY]: {
        key: 'music_victory',
        volume: 0.8,
        loop: false,
        fadeInDuration: 500,
      },
    };

    // Create music instances with Web Audio API
    for (const [theme, config] of Object.entries(musicConfigs)) {
      try {
        const music = this.createWebAudioSound(config);
        this.musicTracks.set(theme as MusicTheme, music);
      } catch (error) {
        console.warn(`Failed to load music track: ${config.key}`, error);
      }
    }
  }

  /**
   * Play a sound effect for a game event
   */
  playSoundEffect(eventType: AudioEventType): void {
    if (this.isMuted) return;

    const sound = this.soundEffects.get(eventType);
    if (sound) {
      const volume = this.volumeSettings.master * this.volumeSettings.sfx;
      sound.play({ volume });
      console.log(`🔊 Playing sound: ${eventType}`);
    } else {
      console.log(`Sound effect: ${eventType}`);
    }
  }

  /**
   * Stop a sound effect
   */
  stopSoundEffect(eventType: AudioEventType): void {
    const sound = this.soundEffects.get(eventType);
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  /**
   * Switch to a different music theme
   */
  switchMusicTheme(theme: MusicTheme, fadeOut: boolean = true): void {
    if (this.currentTheme === theme) {
      return; // Already playing this theme
    }

    // Stop current music
    if (this.currentMusic && this.currentMusic.isPlaying) {
      if (fadeOut) {
        // In real implementation, use Phaser's fade out
        this.currentMusic.stop();
      } else {
        this.currentMusic.stop();
      }
    }

    // Start new music
    const newMusic = this.musicTracks.get(theme);
    if (newMusic) {
      if (!this.isMuted) {
        const volume = this.volumeSettings.master * this.volumeSettings.music;
        newMusic.play({ volume, loop: true });
      }
      this.currentMusic = newMusic;
      this.currentTheme = theme;
    } else {
      console.warn(`Music theme not found: ${theme}`);
    }
  }

  /**
   * Stop all music
   */
  stopMusic(): void {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.stop();
    }
    this.currentMusic = null;
    this.currentTheme = null;
  }

  /**
   * Set volume for a specific category
   */
  setVolume(category: keyof VolumeSettings, volume: number): void {
    this.volumeSettings[category] = Math.max(0, Math.min(1, volume));
    
    // Update current music volume if playing
    if (this.currentMusic && this.currentMusic.isPlaying && category === 'music') {
      const newVolume = this.volumeSettings.master * this.volumeSettings.music;
      // Use type assertion for Phaser sound methods
      (this.currentMusic as any).setVolume(newVolume);
    }
  }

  /**
   * Get volume for a specific category
   */
  getVolume(category: keyof VolumeSettings): number {
    return this.volumeSettings[category];
  }

  /**
   * Get all volume settings
   */
  getVolumeSettings(): VolumeSettings {
    return { ...this.volumeSettings };
  }

  /**
   * Mute all audio
   */
  mute(): void {
    this.isMuted = true;
    
    // Stop all currently playing sounds
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.pause();
    }
  }

  /**
   * Unmute all audio
   */
  unmute(): void {
    this.isMuted = false;
    
    // Resume music if it was playing
    if (this.currentMusic && !this.currentMusic.isPlaying && this.currentTheme) {
      const volume = this.volumeSettings.master * this.volumeSettings.music;
      this.currentMusic.resume();
      // Use type assertion for Phaser sound methods
      (this.currentMusic as any).setVolume(volume);
    }
  }

  /**
   * Check if audio is muted
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Get current music theme
   */
  getCurrentTheme(): MusicTheme | null {
    return this.currentTheme;
  }

  /**
   * Cleanup audio resources
   */
  destroy(): void {
    this.stopMusic();
    
    // Stop all sound effects
    for (const sound of this.soundEffects.values()) {
      if (sound.isPlaying) {
        sound.stop();
      }
    }
    
    this.soundEffects.clear();
    this.musicTracks.clear();
  }

  /**
   * Create a simple sound using HTML5 Audio API
   */
  private createWebAudioSound(config: SoundConfig | MusicConfig): any {
    let audioElement: HTMLAudioElement | null = null;
    let isPlaying = false;

    // Map sound keys to working free audio URLs (using Zapsplat and other CDNs)
    const audioUrls: Record<string, string> = {
      'sfx_phase': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_001_92765.mp3',
      'sfx_possess': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_002_92766.mp3',
      'sfx_sense': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_003_92767.mp3',
      'sfx_speed': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_004_92768.mp3',
      'sfx_pickup': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_005_92769.mp3',
      'sfx_puzzle_solved': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_006_92770.mp3',
      'sfx_door_unlock': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_007_92771.mp3',
      'sfx_trap': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_008_92772.mp3',
      'sfx_guard_warning': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_009_92773.mp3',
      'sfx_death': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_010_92774.mp3',
      'sfx_level_complete': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_011_92775.mp3',
      'sfx_menu_select': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_012_92776.mp3',
      'sfx_menu_back': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_013_92777.mp3',
      'sfx_hint': 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-78882/zapsplat_science_fiction_laser_gun_shot_014_92778.mp3',
      'music_menu': 'https://assets.mixkit.co/active_storage/music/2869/2869-preview.mp3',
      'music_linear': 'https://assets.mixkit.co/active_storage/music/2870/2870-preview.mp3',
      'music_shadow': 'https://assets.mixkit.co/active_storage/music/2871/2871-preview.mp3',
      'music_memory': 'https://assets.mixkit.co/active_storage/music/2872/2872-preview.mp3',
      'music_multilayer': 'https://assets.mixkit.co/active_storage/music/2873/2873-preview.mp3',
      'music_timechange': 'https://assets.mixkit.co/active_storage/music/2874/2874-preview.mp3',
      'music_boss': 'https://assets.mixkit.co/active_storage/music/2875/2875-preview.mp3',
      'music_victory': 'https://assets.mixkit.co/active_storage/music/2876/2876-preview.mp3',
    };

    return {
      play: (options?: any) => {
        try {
          if (!audioElement) {
            audioElement = new Audio();
            audioElement.src = audioUrls[config.key] || '';
            audioElement.loop = (config as any).loop || false;
            audioElement.volume = options?.volume || config.volume || 0.5;
          }
          
          audioElement.currentTime = 0;
          audioElement.play().catch(err => console.log(`Audio play: ${config.key}`));
          isPlaying = true;
        } catch (error) {
          console.log(`Audio: ${config.key}`);
        }
      },
      stop: () => {
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
          isPlaying = false;
        }
      },
      pause: () => {
        if (audioElement) {
          audioElement.pause();
          isPlaying = false;
        }
      },
      resume: () => {
        if (audioElement) {
          audioElement.play().catch(err => console.log(`Audio resume: ${config.key}`));
          isPlaying = true;
        }
      },
      setVolume: (volume: number) => {
        if (audioElement) {
          audioElement.volume = Math.max(0, Math.min(1, volume));
        }
      },
      get isPlaying() {
        return isPlaying && audioElement && !audioElement.paused;
      },
    };
  }
}
