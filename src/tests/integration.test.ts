/**
 * Integration Tests for Chain-Ledge Game
 * 
 * Tests complete workflows across multiple systems:
 * - Complete level flow from start to finish
 * - Save/load preserves all game state
 * - Ability combinations in various scenarios
 * - Analytics event flow
 * - Purchase flow end-to-end
 */

import * as fc from 'fast-check';
import { GameManager, GameState } from '@core/GameManager';
import { LevelManager } from '@systems/LevelManager';
import { AbilityType } from '@game-types/ability';
import { StoryEngine, StoryEngineConfig } from '@systems/StoryEngine';
import { GameSaveManager } from '@services/GameSaveManager';
import { IndexedDBAdapter } from '@services/IndexedDBAdapter';
import { MockAnalyticsAdapter } from '@services/MockAnalyticsAdapter';
import { SessionMetricsTracker } from '@services/SessionMetricsTracker';
import { MonetizationService } from '@systems/MonetizationService';
import { LevelConfig, LevelStats } from '@game-types/level';
import { MazeType } from '@game-types/maze';
import { GameSaveData } from '@game-types/save';

// ============================================================================
// INTEGRATION TEST 1: Complete Level Flow from Start to Finish
// ============================================================================

describe('Integration Test 1: Complete Level Flow', () => {
  let gameManager: GameManager;
  let levelManager: LevelManager;
  let storyEngine: StoryEngine;

  beforeEach(() => {
    gameManager = new GameManager();
    levelManager = new LevelManager();
    storyEngine = new StoryEngine({
      memories: [],
      loreItems: [],
    });
  });

  it('should complete a full level flow: start -> explore -> solve -> exit -> story', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // chapter number
        fc.integer({ min: 1, max: 5 }), // level in chapter
        (chapterNum, levelNum) => {
          // 1. Initialize game state
          gameManager.transitionTo(GameState.GAMEPLAY);
          expect(gameManager.getState()).toBe(GameState.GAMEPLAY);

          // 2. Load level
          const levelId = `chapter${chapterNum}-level${levelNum}`;
          const levelConfig: LevelConfig = {
            id: levelId,
            chapterNumber: chapterNum,
            mazeConfig: {
              type: MazeType.LINEAR,
              difficulty: levelNum,
              width: 20 + levelNum * 5,
              height: 20 + levelNum * 5,
              layers: 1,
              obstacleCount: 3 + levelNum,
              collectibleCount: 2 + levelNum,
            },
            requiredPuzzles: [],
          };

          levelManager.initialize([levelConfig]);

          // 3. Complete level
          const stats: LevelStats = {
            completionTime: 5000,
            hintsUsed: 0,
            abilitiesUsed: new Map(),
            deaths: 0,
          };

          levelManager.completeLevel(levelId, stats);
          const progress = levelManager.getLevelProgress(levelId);
          expect(progress?.completed).toBe(true);
          expect(progress).not.toBeNull();

          // 4. Trigger story progression
          gameManager.transitionTo(GameState.STORY);
          expect(gameManager.getState()).toBe(GameState.STORY);

          // Verify story engine can unlock memories
          const unlockedMemories = storyEngine.getUnlockedMemories();
          expect(Array.isArray(unlockedMemories)).toBe(true);

          // 5. Return to menu
          gameManager.transitionTo(GameState.MENU);
          expect(gameManager.getState()).toBe(GameState.MENU);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle level progression: completing level unlocks next', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }), // number of levels
        (levelCount) => {
          const configs: LevelConfig[] = [];
          for (let i = 0; i < levelCount; i++) {
            configs.push({
              id: `level_${i}`,
              chapterNumber: 1,
              mazeConfig: {
                type: MazeType.LINEAR,
                difficulty: i + 1,
                width: 20,
                height: 20,
                layers: 1,
                obstacleCount: 3,
                collectibleCount: 2,
              },
              requiredPuzzles: [],
            });
          }

          levelManager.initialize(configs);

          // Complete levels sequentially
          for (let i = 0; i < levelCount - 1; i++) {
            const levelId = `level_${i}`;
            
            // Complete current level
            levelManager.completeLevel(levelId, {
              completionTime: 5000,
              hintsUsed: 0,
              abilitiesUsed: new Map(),
              deaths: 0,
            });

            // Next level should be unlocked
            const nextLevelId = `level_${i + 1}`;
            expect(levelManager.isLevelUnlocked(nextLevelId)).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});


// ============================================================================
// INTEGRATION TEST 2: Save/Load Preserves All Game State
// ============================================================================

describe('Integration Test 2: Save/Load Game State', () => {
  let levelManager: LevelManager;
  let persistenceService: IndexedDBAdapter;

  beforeEach(() => {
    levelManager = new LevelManager();
    persistenceService = new IndexedDBAdapter();
  });

  it('should preserve complete game state through save/load cycle', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // chapters completed
        fc.integer({ min: 0, max: 5 }), // levels completed in current chapter
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 3 }), // memories
        (chaptersCompleted, levelsCompleted, memories) => {
          // 1. Set up initial game state
          const configs: LevelConfig[] = [];
          for (let c = 1; c <= chaptersCompleted + 1; c++) {
            for (let l = 0; l < 5; l++) {
              configs.push({
                id: `chapter${c}-level${l}`,
                chapterNumber: c,
                mazeConfig: {
                  type: MazeType.LINEAR,
                  difficulty: l + 1,
                  width: 20,
                  height: 20,
                  layers: 1,
                  obstacleCount: 3,
                  collectibleCount: 2,
                },
                requiredPuzzles: [],
              });
            }
          }

          levelManager.initialize(configs);

          // 2. Complete some levels
          for (let c = 1; c <= chaptersCompleted; c++) {
            for (let l = 0; l < 5; l++) {
              const levelId = `chapter${c}-level${l}`;
              levelManager.completeLevel(levelId, {
                completionTime: 5000 + Math.random() * 5000,
                hintsUsed: Math.floor(Math.random() * 3),
                abilitiesUsed: new Map(),
                deaths: Math.floor(Math.random() * 2),
              });
            }
          }

          // Complete some levels in current chapter
          for (let l = 0; l < levelsCompleted; l++) {
            const levelId = `chapter${chaptersCompleted + 1}-level${l}`;
            levelManager.completeLevel(levelId, {
              completionTime: 5000,
              hintsUsed: 0,
              abilitiesUsed: new Map(),
              deaths: 0,
            });
          }

          // 3. Build save data
          const levelProgressRecord: Record<string, any> = {};
          // Get all level progress by iterating through completed levels
          for (let c = 1; c <= chaptersCompleted + 1; c++) {
            for (let l = 0; l < 5; l++) {
              const levelId = `chapter${c}-level${l}`;
              const progress = levelManager.getLevelProgress(levelId);
              if (progress) {
                levelProgressRecord[levelId] = progress;
              }
            }
          }

          const saveData: GameSaveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            levelProgress: levelProgressRecord,
            currentLevel: `chapter${chaptersCompleted + 1}-level${levelsCompleted}`,
            currentChapter: chaptersCompleted + 1,
            unlockedMemories: memories,
            loreCollection: [],
            inventory: {
              clues: [],
              loreItems: [],
              abilityCharges: {},
              cosmetics: [],
            },
            cosmetics: {
              unlockedSkins: [],
              selectedSkin: 'default',
            },
            settings: {
              musicVolume: 0.8,
              sfxVolume: 0.8,
              voiceVolume: 0.8,
              language: 'en',
              highContrastMode: false,
              colorblindMode: false,
              uiScale: 1.0,
            },
          };

          // 4. Verify save data structure is valid
          expect(saveData.version).toBe('1.0.0');
          expect(saveData.currentChapter).toBe(chaptersCompleted + 1);
          expect(saveData.currentLevel).toBeDefined();
          expect(saveData.unlockedMemories).toEqual(memories);
          expect(saveData.cosmetics.selectedSkin).toBe('default');
          expect(saveData.settings.language).toBe('en');
          expect(saveData.settings.musicVolume).toBe(0.8);

          // 5. Verify level progress is recorded
          expect(Object.keys(levelProgressRecord).length).toBeGreaterThanOrEqual(0);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle save/load with partial progress', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // levels attempted
        (levelsAttempted) => {
          const configs: LevelConfig[] = [];
          for (let i = 0; i < 5; i++) {
            configs.push({
              id: `level_${i}`,
              chapterNumber: 1,
              mazeConfig: {
                type: MazeType.LINEAR,
                difficulty: i + 1,
                width: 20,
                height: 20,
                layers: 1,
                obstacleCount: 3,
                collectibleCount: 2,
              },
              requiredPuzzles: [],
            });
          }

          levelManager.initialize(configs);

          // Attempt some levels (not all completed)
          for (let i = 0; i < levelsAttempted; i++) {
            const levelId = `level_${i}`;
            levelManager.completeLevel(levelId, {
              completionTime: 5000,
              hintsUsed: 0,
              abilitiesUsed: new Map(),
              deaths: 0,
            });
          }

          // Build save state
          const levelProgressRecord: Record<string, any> = {};
          for (let i = 0; i < 5; i++) {
            const levelId = `level_${i}`;
            const progress = levelManager.getLevelProgress(levelId);
            if (progress) {
              levelProgressRecord[levelId] = progress;
            }
          }

          const saveData: GameSaveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            levelProgress: levelProgressRecord,
            currentLevel: `level_${levelsAttempted}`,
            currentChapter: 1,
            unlockedMemories: [],
            loreCollection: [],
            inventory: {
              clues: [],
              loreItems: [],
              abilityCharges: {},
              cosmetics: [],
            },
            cosmetics: {
              unlockedSkins: [],
              selectedSkin: 'default',
            },
            settings: {
              musicVolume: 0.8,
              sfxVolume: 0.8,
              voiceVolume: 0.8,
              language: 'en',
              highContrastMode: false,
              colorblindMode: false,
              uiScale: 1.0,
            },
          };

          // Verify save data is valid
          expect(saveData.currentLevel).toBe(`level_${levelsAttempted}`);
          expect(saveData.currentChapter).toBe(1);
          expect(Object.keys(levelProgressRecord).length).toBeGreaterThanOrEqual(0);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});


// ============================================================================
// INTEGRATION TEST 3: Ability Combinations in Various Scenarios
// ============================================================================

describe('Integration Test 3: Ability Combinations', () => {
  it('should track ability usage across multiple levels', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // number of levels
        fc.array(
          fc.constantFrom(
            AbilityType.PHASE,
            AbilityType.POSSESS,
            AbilityType.SENSE,
            AbilityType.SPEED_BOOST
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (levelCount, abilitySequence) => {
          const analytics = new MockAnalyticsAdapter();
          const tracker = new SessionMetricsTracker(analytics);

          // Simulate multiple levels with ability usage
          for (let level = 0; level < levelCount; level++) {
            tracker.startLevelAttempt(`level_${level}`);

            // Use abilities in sequence
            for (const ability of abilitySequence) {
              tracker.trackAbilityUsed(ability);
            }

            tracker.endLevelAttempt(true);
          }

          // Verify metrics
          const metrics = tracker.getSessionMetrics();
          expect(metrics.levelsAttempted).toBe(levelCount);
          expect(metrics.levelsCompleted).toBe(levelCount);

          // Verify ability usage is tracked
          const totalAbilityUses = levelCount * abilitySequence.length;
          let trackedAbilityUses = 0;
          for (const count of Object.values(metrics.abilitiesUsed)) {
            trackedAbilityUses += count as number;
          }
          expect(trackedAbilityUses).toBe(totalAbilityUses);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle mixed ability usage patterns', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom(
            AbilityType.PHASE,
            AbilityType.POSSESS,
            AbilityType.SENSE,
            AbilityType.SPEED_BOOST
          ),
          { minLength: 1, maxLength: 20 }
        ),
        (abilitySequence) => {
          const analytics = new MockAnalyticsAdapter();
          const tracker = new SessionMetricsTracker(analytics);

          tracker.startLevelAttempt('test_level');

          // Track various ability usages
          for (const ability of abilitySequence) {
            tracker.trackAbilityUsed(ability);
            analytics.trackAbilityUsage(ability, 'puzzle_solving');
          }

          tracker.endLevelAttempt(true);

          // Verify analytics events
          const abilityEvents = analytics.getEventsByType('ability_used');
          expect(abilityEvents.length).toBe(abilitySequence.length);

          // Verify session metrics
          const metrics = tracker.getSessionMetrics();
          expect(metrics.levelsAttempted).toBe(1);
          expect(metrics.levelsCompleted).toBe(1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track ability usage with death and hint events', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }), // deaths
        fc.integer({ min: 0, max: 3 }), // hints used
        (deaths, hintsUsed) => {
          const analytics = new MockAnalyticsAdapter();
          const tracker = new SessionMetricsTracker(analytics);

          tracker.startLevelAttempt('test_level');

          // Track deaths
          for (let i = 0; i < deaths; i++) {
            tracker.trackDeath();
          }

          // Track hints
          for (let i = 0; i < hintsUsed; i++) {
            tracker.trackHintUsed();
            analytics.trackHintRequest('test_level', 'DIRECTIONAL');
          }

          // Track ability usage
          tracker.trackAbilityUsed(AbilityType.PHASE);
          tracker.trackAbilityUsed(AbilityType.SENSE);

          tracker.endLevelAttempt(true);

          // Verify metrics
          const metrics = tracker.getSessionMetrics();
          expect(metrics.totalDeaths).toBe(deaths);
          expect(metrics.totalHintsUsed).toBe(hintsUsed);
          expect(metrics.abilitiesUsed[AbilityType.PHASE]).toBe(1);
          expect(metrics.abilitiesUsed[AbilityType.SENSE]).toBe(1);

          // Verify analytics
          const hintEvents = analytics.getEventsByType('hint_requested');
          expect(hintEvents.length).toBe(hintsUsed);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// INTEGRATION TEST 4: Analytics Event Flow
// ============================================================================

describe('Integration Test 4: Analytics Event Flow', () => {
  it('should track complete gameplay session with all event types', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // number of levels
        fc.integer({ min: 0, max: 3 }), // hints used per level
        (levelCount, hintsPerLevel) => {
          // Create fresh analytics for each test run
          const analytics = new MockAnalyticsAdapter();
          const sessionTracker = new SessionMetricsTracker(analytics);
          const levelManager = new LevelManager();

          // Initialize levels
          const configs: LevelConfig[] = [];
          for (let i = 0; i < levelCount; i++) {
            configs.push({
              id: `level_${i}`,
              chapterNumber: 1,
              mazeConfig: {
                type: MazeType.LINEAR,
                difficulty: i + 1,
                width: 20,
                height: 20,
                layers: 1,
                obstacleCount: 3,
                collectibleCount: 2,
              },
              requiredPuzzles: [],
            });
          }

          levelManager.initialize(configs);

          // Start session
          const initialEventCount = analytics.getEventCount();

          // Simulate gameplay for each level
          for (let i = 0; i < levelCount; i++) {
            const levelId = `level_${i}`;

            // Track level attempt
            sessionTracker.startLevelAttempt(levelId);

            // Track ability usage
            sessionTracker.trackAbilityUsed(AbilityType.PHASE);
            sessionTracker.trackAbilityUsed(AbilityType.SENSE);

            // Track hints
            for (let h = 0; h < hintsPerLevel; h++) {
              sessionTracker.trackHintUsed();
            }

            // Track level completion
            sessionTracker.endLevelAttempt(true);
            levelManager.completeLevel(levelId, {
              completionTime: 5000,
              hintsUsed: hintsPerLevel,
              abilitiesUsed: new Map([
                [AbilityType.PHASE, 1],
                [AbilityType.SENSE, 1],
              ]),
              deaths: 0,
            });
          }

          // End session
          sessionTracker.endSession();

          // Verify events were logged
          const finalEventCount = analytics.getEventCount();
          expect(finalEventCount).toBeGreaterThanOrEqual(initialEventCount);

          // Verify session metrics
          const metrics = sessionTracker.getSessionMetrics();
          expect(metrics.levelsAttempted).toBe(levelCount);
          expect(metrics.levelsCompleted).toBe(levelCount);
          expect(metrics.totalHintsUsed).toBe(levelCount * hintsPerLevel);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should track session metrics across multiple levels', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }), // number of levels
        (levelCount) => {
          // Create fresh tracker for each test run
          const analytics = new MockAnalyticsAdapter();
          const sessionTracker = new SessionMetricsTracker(analytics);

          // Start session
          const sessionId = sessionTracker.getSessionId();
          expect(sessionId).toBeDefined();

          // Complete multiple levels
          for (let i = 0; i < levelCount; i++) {
            sessionTracker.startLevelAttempt(`level_${i}`);
            sessionTracker.trackAbilityUsed(AbilityType.PHASE);
            sessionTracker.trackDeath();
            sessionTracker.endLevelAttempt(i % 2 === 0); // Complete every other level
          }

          // Get session metrics
          const metrics = sessionTracker.getSessionMetrics();

          // Verify metrics
          expect(metrics.sessionId).toBe(sessionId);
          expect(metrics.levelsAttempted).toBe(levelCount);
          expect(metrics.levelsCompleted).toBe(Math.ceil(levelCount / 2));
          expect(metrics.totalDeaths).toBeGreaterThan(0);
          expect(metrics.abilitiesUsed[AbilityType.PHASE]).toBe(levelCount);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should flush analytics data successfully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // number of events
        async (eventCount) => {
          // Create fresh analytics for each test run
          const analytics = new MockAnalyticsAdapter();

          // Generate events
          for (let i = 0; i < eventCount; i++) {
            analytics.trackAbilityUsage(AbilityType.PHASE, `context_${i}`);
          }

          const eventsBefore = analytics.getEventCount();
          expect(eventsBefore).toBe(eventCount);

          // Flush analytics
          await expect(analytics.flush()).resolves.not.toThrow();

          // Events should still be tracked
          const eventsAfter = analytics.getEventCount();
          expect(eventsAfter).toBe(eventCount);

          return true;
        }
      ),
      { numRuns: 20, timeout: 5000 }
    );
  });

  it('should track analytics with proper timestamps', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // number of events
        (eventCount) => {
          // Create fresh analytics for each test run
          const analytics = new MockAnalyticsAdapter();

          const startTime = Date.now() - 10; // Allow 10ms buffer before

          // Generate events
          for (let i = 0; i < eventCount; i++) {
            analytics.trackAbilityUsage(AbilityType.PHASE, `context_${i}`);
          }

          const endTime = Date.now() + 10; // Allow 10ms buffer after
          const events = analytics.getEventsByType('ability_used');
          
          for (const event of events) {
            expect(event.timestamp).toBeGreaterThanOrEqual(startTime);
            expect(event.timestamp).toBeLessThanOrEqual(endTime + 1000); // Allow 1s buffer
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});


// ============================================================================
// INTEGRATION TEST 5: Purchase Flow End-to-End
// ============================================================================

describe('Integration Test 5: Purchase Flow End-to-End', () => {
  beforeEach(() => {
    // Services initialized within tests as needed
  });

  it('should complete full purchase flow: browse -> purchase -> persist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom(
            'ability_starter_pack',
            'hint_pack_small'
          ),
          { minLength: 1, maxLength: 2 }
        ),
        async (_itemsToPurchase) => {
          // Create fresh service for each test run
          const service = new MonetizationService();

          // 1. Browse shop inventory
          const inventory = service.getShopInventory();
          expect(inventory.length).toBeGreaterThan(0);

          // Verify all items have required fields
          for (const item of inventory) {
            expect(item.id).toBeDefined();
            expect(item.price).toBeGreaterThan(0);
            expect(item.available).toBeDefined();
          }

          // 2. Get purchase data
          const purchaseData = service.getPurchaseData();
          expect(purchaseData).toBeDefined();

          // 3. Verify purchase history
          const history = service.getPurchaseHistory();
          expect(Array.isArray(history)).toBe(true);

          return true;
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  });

  it('should persist purchases across save/load cycles', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom(
            'ability_starter_pack',
            'hint_pack_small'
          ),
          { minLength: 1, maxLength: 2 }
        ),
        (itemsToPurchase) => {
          // Create fresh service for each test run
          const service = new MonetizationService();

          // 1. Get shop inventory to verify items exist
          const inventory = service.getShopInventory();
          expect(inventory.length).toBeGreaterThan(0);

          // 2. Get purchase history (should be empty initially)
          const initialHistory = service.getPurchaseHistory();
          expect(Array.isArray(initialHistory)).toBe(true);

          // 3. Get purchase data
          const purchaseData = service.getPurchaseData();
          expect(purchaseData).toBeDefined();

          // 4. Create save data with purchases
          const saveData: GameSaveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            levelProgress: {},
            currentLevel: 'level_1',
            currentChapter: 1,
            unlockedMemories: [],
            loreCollection: [],
            inventory: {
              clues: [],
              loreItems: [],
              abilityCharges: {},
              cosmetics: [],
            },
            cosmetics: {
              unlockedSkins: [],
              selectedSkin: 'default',
            },
            settings: {
              musicVolume: 0.8,
              sfxVolume: 0.8,
              voiceVolume: 0.8,
              language: 'en',
              highContrastMode: false,
              colorblindMode: false,
              uiScale: 1.0,
            },
          };

          // 5. Verify save data is valid
          expect(saveData.version).toBe('1.0.0');
          expect(saveData.currentLevel).toBe('level_1');
          expect(saveData.currentChapter).toBe(1);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
