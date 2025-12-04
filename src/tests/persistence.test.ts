import * as fc from 'fast-check';
import { GameSaveManager, SaveManagerConfig } from '@services/GameSaveManager';
import { PersistenceService } from '@services/PersistenceService';
import { GameSaveData } from '@game-types/save';

/**
 * Mock PersistenceService for testing
 */
class MockPersistenceService implements PersistenceService {
  private storage: Map<string, any> = new Map();
  private shouldFail: boolean = false;
  private failCount: number = 0;
  private currentFailures: number = 0;

  setFailureMode(shouldFail: boolean, failCount: number = 0): void {
    this.shouldFail = shouldFail;
    this.failCount = failCount;
    this.currentFailures = 0;
  }

  async save(key: string, data: any): Promise<boolean> {
    if (this.shouldFail && this.currentFailures < this.failCount) {
      this.currentFailures++;
      return false;
    }
    this.storage.set(key, JSON.parse(JSON.stringify(data)));
    return true;
  }

  async load(key: string): Promise<any> {
    const data = this.storage.get(key);
    return data ? JSON.parse(JSON.stringify(data)) : null;
  }

  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

// Helper to create a random save data generator
const gameSaveDataArbitrary = (): fc.Arbitrary<GameSaveData> => {
  return fc.record({
    version: fc.constant('1.0.0'),
    timestamp: fc.integer({ min: 0, max: Date.now() }),
    levelProgress: fc.dictionary(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.record({
        levelId: fc.string({ minLength: 1, maxLength: 20 }),
        completed: fc.boolean(),
        attempts: fc.integer({ min: 0, max: 100 }),
        bestTime: fc.integer({ min: 0, max: 10000 }),
        hintsUsed: fc.integer({ min: 0, max: 50 }),
        collectiblesFound: fc.integer({ min: 0, max: 20 }),
      })
    ),
    currentLevel: fc.string({ minLength: 1, maxLength: 20 }),
    currentChapter: fc.integer({ min: 1, max: 10 }),
    unlockedMemories: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
    loreCollection: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
    inventory: fc.record({
      clues: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
      loreItems: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
      abilityCharges: fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 10 })
      ),
      cosmetics: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
    }),
    cosmetics: fc.record({
      unlockedSkins: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
      selectedSkin: fc.string({ minLength: 1, maxLength: 20 }),
    }),
    settings: fc.record({
      musicVolume: fc.double({ min: 0, max: 1 }),
      sfxVolume: fc.double({ min: 0, max: 1 }),
      voiceVolume: fc.double({ min: 0, max: 1 }),
      language: fc.constantFrom('en', 'es', 'zh', 'fr', 'de'),
      highContrastMode: fc.boolean(),
      colorblindMode: fc.boolean(),
      uiScale: fc.double({ min: 0.5, max: 2.0 }),
    }),
  });
};

// Feature: chain-ledge-game, Property 30: Auto-save interval
// Validates: Requirements 11.5

describe('Persistence Property Tests', () => {
  describe('Property 30: Auto-save interval', () => {
    test('For any gameplay session longer than the auto-save interval, the game should perform automatic saves at the configured interval', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100, max: 500 }), // auto-save interval in ms
          fc.integer({ min: 2, max: 3 }), // number of intervals to wait
          gameSaveDataArbitrary(),
          async (intervalMs, numIntervals, saveData) => {
            const mockService = new MockPersistenceService();
            const config: Partial<SaveManagerConfig> = {
              autoSaveIntervalMs: intervalMs,
              saveKey: 'test_save',
            };

            const manager = new GameSaveManager(mockService, config);
            
            let saveCount = 0;
            const getSaveData = () => {
              saveCount++;
              return saveData;
            };

            // Start auto-save
            manager.startAutoSave(getSaveData);

            // Wait for multiple intervals
            const totalWaitTime = intervalMs * numIntervals + 100; // Add buffer
            await new Promise(resolve => setTimeout(resolve, totalWaitTime));

            // Stop auto-save
            manager.stopAutoSave();

            // Verify that saves occurred at the expected intervals
            // We expect at least numIntervals saves (could be numIntervals or numIntervals+1)
            expect(saveCount).toBeGreaterThanOrEqual(numIntervals);
            expect(saveCount).toBeLessThanOrEqual(numIntervals + 2);
          }
        ),
        { numRuns: 5, timeout: 30000 } // Reduced runs due to timing tests
      );
    });

    test('Auto-save should be active after starting and inactive after stopping', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          gameSaveDataArbitrary(),
          (intervalMs, saveData) => {
            const mockService = new MockPersistenceService();
            const config: Partial<SaveManagerConfig> = {
              autoSaveIntervalMs: intervalMs,
            };

            const manager = new GameSaveManager(mockService, config);
            
            // Initially not active
            expect(manager.isAutoSaveActive()).toBe(false);

            // Start auto-save
            manager.startAutoSave(() => saveData);
            expect(manager.isAutoSaveActive()).toBe(true);

            // Stop auto-save
            manager.stopAutoSave();
            expect(manager.isAutoSaveActive()).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  // Feature: chain-ledge-game, Property 31: Save retry on failure
  // Validates: Requirements 11.4

  describe('Property 31: Save retry on failure', () => {
    test('For any failed save operation, the system should retry the save operation up to the configured retry limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }), // max retries
          fc.integer({ min: 1, max: 2 }), // number of failures before success
          gameSaveDataArbitrary(),
          async (maxRetries, failuresBeforeSuccess, saveData) => {
            const mockService = new MockPersistenceService();
            const config: Partial<SaveManagerConfig> = {
              maxRetries,
              retryDelayMs: 5, // Short delay for testing
              saveKey: 'test_save',
            };

            const manager = new GameSaveManager(mockService, config);

            // Set mock to fail a specific number of times
            mockService.setFailureMode(true, failuresBeforeSuccess);

            const success = await manager.saveGame(saveData);

            if (failuresBeforeSuccess < maxRetries) {
              // Should succeed after retries
              expect(success).toBe(true);
              
              // Verify data was saved
              const loaded = await mockService.load('test_save');
              expect(loaded).toBeDefined();
              expect(loaded.version).toBe(saveData.version);
            } else {
              // Should fail after exhausting retries
              expect(success).toBe(false);
            }
          }
        ),
        { numRuns: 10, timeout: 10000 }
      );
    });

    test('Save should succeed immediately if no failures occur', async () => {
      await fc.assert(
        fc.asyncProperty(
          gameSaveDataArbitrary(),
          async (saveData) => {
            const mockService = new MockPersistenceService();
            const manager = new GameSaveManager(mockService);

            const success = await manager.saveGame(saveData);

            expect(success).toBe(true);
            
            // Verify data was saved correctly
            const loaded = await mockService.load('game_save');
            expect(loaded).toBeDefined();
            expect(loaded.version).toBe(saveData.version);
            expect(loaded.currentLevel).toBe(saveData.currentLevel);
            expect(loaded.currentChapter).toBe(saveData.currentChapter);
          }
        ),
        { numRuns: 100, timeout: 5000 }
      );
    });
  });

  // Feature: chain-ledge-game, Property 28: Save/load round trip
  // Validates: Requirements 8.4, 11.1, 11.2, 11.3

  describe('Property 28: Save/load round trip', () => {
    test('For any game state, saving then loading should restore an equivalent game state', async () => {
      await fc.assert(
        fc.asyncProperty(
          gameSaveDataArbitrary(),
          async (originalData) => {
            const mockService = new MockPersistenceService();
            const manager = new GameSaveManager(mockService);

            // Save the data
            const saveSuccess = await manager.saveGame(originalData);
            expect(saveSuccess).toBe(true);

            // Load the data
            const loadedData = await manager.loadGame();
            expect(loadedData).not.toBeNull();

            if (loadedData) {
              // Verify all fields match (timestamp will be updated, so check separately)
              expect(loadedData.version).toBe(originalData.version);
              expect(loadedData.currentLevel).toBe(originalData.currentLevel);
              expect(loadedData.currentChapter).toBe(originalData.currentChapter);
              expect(loadedData.unlockedMemories).toEqual(originalData.unlockedMemories);
              expect(loadedData.loreCollection).toEqual(originalData.loreCollection);
              
              // Deep equality checks for complex objects
              expect(loadedData.levelProgress).toEqual(originalData.levelProgress);
              expect(loadedData.inventory).toEqual(originalData.inventory);
              expect(loadedData.cosmetics).toEqual(originalData.cosmetics);
              
              // Settings comparison - handle NaN serialization (JSON converts NaN to null)
              const expectedSettings = { ...originalData.settings };
              const loadedSettings = { ...loadedData.settings };
              
              // Replace NaN with null for comparison since JSON.stringify converts NaN to null
              if (Number.isNaN(expectedSettings.uiScale)) {
                expectedSettings.uiScale = null as any;
              }
              if (Number.isNaN(loadedSettings.uiScale)) {
                loadedSettings.uiScale = null as any;
              }
              
              expect(loadedSettings).toEqual(expectedSettings);
              
              // Timestamp should be updated
              expect(loadedData.timestamp).toBeGreaterThanOrEqual(originalData.timestamp);
            }
          }
        ),
        { numRuns: 20, timeout: 5000 }
      );
    });

    test('Loading non-existent save should return null', async () => {
      const mockService = new MockPersistenceService();
      const manager = new GameSaveManager(mockService);

      const loadedData = await manager.loadGame();
      expect(loadedData).toBeNull();
    });

    test('Save data validation should reject invalid data', async () => {
      const mockService = new MockPersistenceService();
      const manager = new GameSaveManager(mockService);

      // Try to save invalid data (missing required fields)
      const invalidData = {
        version: '1.0.0',
        timestamp: Date.now(),
        // Missing other required fields
      } as any;

      const success = await manager.saveGame(invalidData);
      expect(success).toBe(false);
    });
  });

  describe('Save on exit functionality', () => {
    test('Save on exit should stop auto-save and perform final save', async () => {
      await fc.assert(
        fc.asyncProperty(
          gameSaveDataArbitrary(),
          async (saveData) => {
            const mockService = new MockPersistenceService();
            const manager = new GameSaveManager(mockService, {
              autoSaveIntervalMs: 1000,
            });

            // Start auto-save
            manager.startAutoSave(() => saveData);
            expect(manager.isAutoSaveActive()).toBe(true);

            // Save on exit
            const success = await manager.saveOnExit(saveData);
            
            expect(success).toBe(true);
            expect(manager.isAutoSaveActive()).toBe(false);
            
            // Verify data was saved
            const loaded = await manager.loadGame();
            expect(loaded).not.toBeNull();
          }
        ),
        { numRuns: 5, timeout: 5000 }
      );
    });
  });

  describe('Save data existence check', () => {
    test('hasSaveData should return true after save and false after delete', async () => {
      await fc.assert(
        fc.asyncProperty(
          gameSaveDataArbitrary(),
          async (saveData) => {
            const mockService = new MockPersistenceService();
            const manager = new GameSaveManager(mockService);

            // Initially no save data
            expect(await manager.hasSaveData()).toBe(false);

            // Save data
            await manager.saveGame(saveData);
            expect(await manager.hasSaveData()).toBe(true);

            // Delete save
            await manager.deleteSave();
            expect(await manager.hasSaveData()).toBe(false);
          }
        ),
        { numRuns: 100, timeout: 5000 }
      );
    });
  });
});
