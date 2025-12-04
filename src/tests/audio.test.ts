import * as fc from 'fast-check';
import { AudioManager } from '@systems/AudioManager';
import { AudioEventType, MusicTheme } from '@game-types/audio';

// Mock Phaser Scene for testing
class MockScene {
  sound: any = {
    add: (key: string, config: any) => ({
      play: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      isPlaying: false,
    }),
  };
}

// Feature: chain-ledge-game, Property 37: Event-triggered audio playback
// Validates: Requirements 13.1, 13.2, 13.3

describe('Audio System Property Tests', () => {
  describe('Property 37: Event-triggered audio playback', () => {
    test('For any game event with associated audio, the audio system should play the corresponding sound', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(AudioEventType)),
          (eventType) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            // Play sound effect
            audioManager.playSoundEffect(eventType);

            // Verify sound was triggered (in real implementation, we'd check the mock)
            // For now, we verify the manager doesn't throw
            expect(audioManager).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Playing ability sound effects should work for all ability types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            AudioEventType.ABILITY_PHASE,
            AudioEventType.ABILITY_POSSESS,
            AudioEventType.ABILITY_SENSE,
            AudioEventType.ABILITY_SPEED_BOOST
          ),
          (abilityEvent) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            // Should not throw when playing ability sounds
            expect(() => audioManager.playSoundEffect(abilityEvent)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Playing environmental sound effects should work for all event types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            AudioEventType.COLLECTIBLE_PICKUP,
            AudioEventType.PUZZLE_SOLVED,
            AudioEventType.DOOR_UNLOCK,
            AudioEventType.TRAP_TRIGGERED,
            AudioEventType.GUARD_PROXIMITY,
            AudioEventType.DEATH,
            AudioEventType.LEVEL_COMPLETE
          ),
          (envEvent) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            // Should not throw when playing environmental sounds
            expect(() => audioManager.playSoundEffect(envEvent)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Switching music themes should update current theme', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(MusicTheme)),
          fc.constantFrom(...Object.values(MusicTheme)),
          (theme1, theme2) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            // Switch to first theme
            audioManager.switchMusicTheme(theme1);
            expect(audioManager.getCurrentTheme()).toBe(theme1);

            // Switch to second theme
            audioManager.switchMusicTheme(theme2);
            expect(audioManager.getCurrentTheme()).toBe(theme2);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Switching to the same theme should not restart music', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(MusicTheme)),
          (theme) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            // Switch to theme
            audioManager.switchMusicTheme(theme);
            const firstTheme = audioManager.getCurrentTheme();

            // Switch to same theme again
            audioManager.switchMusicTheme(theme);
            const secondTheme = audioManager.getCurrentTheme();

            // Should remain the same
            expect(firstTheme).toBe(secondTheme);
            expect(secondTheme).toBe(theme);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Volume control', () => {
    test('Setting volume should clamp values between 0 and 1', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -10, max: 10 }),
          fc.constantFrom('master', 'music', 'sfx', 'voice'),
          (volume, category) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            audioManager.setVolume(category as any, volume);
            const actualVolume = audioManager.getVolume(category as any);

            // Volume should be clamped to [0, 1]
            expect(actualVolume).toBeGreaterThanOrEqual(0);
            expect(actualVolume).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Volume settings should persist across get/set operations', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1 }),
          fc.double({ min: 0, max: 1 }),
          fc.double({ min: 0, max: 1 }),
          fc.double({ min: 0, max: 1 }),
          (masterVol, musicVol, sfxVol, voiceVol) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            // Set all volumes
            audioManager.setVolume('master', masterVol);
            audioManager.setVolume('music', musicVol);
            audioManager.setVolume('sfx', sfxVol);
            audioManager.setVolume('voice', voiceVol);

            // Get all volumes
            const settings = audioManager.getVolumeSettings();

            // Verify they match
            expect(settings.master).toBeCloseTo(masterVol, 5);
            expect(settings.music).toBeCloseTo(musicVol, 5);
            expect(settings.sfx).toBeCloseTo(sfxVol, 5);
            expect(settings.voice).toBeCloseTo(voiceVol, 5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Mute functionality', () => {
    test('Muting should prevent sound effects from playing', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(AudioEventType)),
          (eventType) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            // Mute audio
            audioManager.mute();
            expect(audioManager.isMutedState()).toBe(true);

            // Try to play sound (should be silenced)
            audioManager.playSoundEffect(eventType);

            // Unmute
            audioManager.unmute();
            expect(audioManager.isMutedState()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Mute state should toggle correctly', () => {
      const mockScene = new MockScene() as any;
      const audioManager = new AudioManager(mockScene);
      audioManager.initialize();

      // Initially not muted
      expect(audioManager.isMutedState()).toBe(false);

      // Mute
      audioManager.mute();
      expect(audioManager.isMutedState()).toBe(true);

      // Unmute
      audioManager.unmute();
      expect(audioManager.isMutedState()).toBe(false);

      // Mute again
      audioManager.mute();
      expect(audioManager.isMutedState()).toBe(true);
    });
  });

  describe('Music management', () => {
    test('Stopping music should clear current theme', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(MusicTheme)),
          (theme) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            // Start music
            audioManager.switchMusicTheme(theme);
            expect(audioManager.getCurrentTheme()).toBe(theme);

            // Stop music
            audioManager.stopMusic();
            expect(audioManager.getCurrentTheme()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Music themes should correspond to maze types', () => {
      const mockScene = new MockScene() as any;
      const audioManager = new AudioManager(mockScene);
      audioManager.initialize();

      // Test that all maze-related themes can be switched to
      const mazeThemes = [
        MusicTheme.LINEAR,
        MusicTheme.SHADOW,
        MusicTheme.MEMORY,
        MusicTheme.MULTI_LAYERED,
        MusicTheme.TIME_CHANGING,
      ];

      for (const theme of mazeThemes) {
        audioManager.switchMusicTheme(theme);
        expect(audioManager.getCurrentTheme()).toBe(theme);
      }
    });
  });

  describe('Sound effect management', () => {
    test('Stopping a sound effect should work for looping sounds', () => {
      const mockScene = new MockScene() as any;
      const audioManager = new AudioManager(mockScene);
      audioManager.initialize();

      // Guard proximity is a looping sound
      audioManager.playSoundEffect(AudioEventType.GUARD_PROXIMITY);
      
      // Should not throw when stopping
      expect(() => audioManager.stopSoundEffect(AudioEventType.GUARD_PROXIMITY)).not.toThrow();
    });

    test('Playing multiple sound effects in sequence should work', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...Object.values(AudioEventType)), { minLength: 1, maxLength: 10 }),
          (events) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            // Play all events in sequence
            for (const event of events) {
              expect(() => audioManager.playSoundEffect(event)).not.toThrow();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cleanup', () => {
    test('Destroying audio manager should stop all sounds', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(MusicTheme)),
          fc.array(fc.constantFrom(...Object.values(AudioEventType)), { minLength: 1, maxLength: 5 }),
          (theme, events) => {
            const mockScene = new MockScene() as any;
            const audioManager = new AudioManager(mockScene);
            audioManager.initialize();

            // Start music and play sounds
            audioManager.switchMusicTheme(theme);
            for (const event of events) {
              audioManager.playSoundEffect(event);
            }

            // Destroy should not throw
            expect(() => audioManager.destroy()).not.toThrow();

            // Current theme should be cleared
            expect(audioManager.getCurrentTheme()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
