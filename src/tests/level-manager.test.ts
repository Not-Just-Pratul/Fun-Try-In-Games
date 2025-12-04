import * as fc from 'fast-check';
import { LevelManager } from '@systems/LevelManager';
import { LevelConfig, LevelStats } from '@game-types/level';
import { MazeType } from '@game-types/maze';
import { AbilityType } from '@game-types/ability';

// Helper to create a simple level config
const createLevelConfig = (levelId: string, chapterNumber: number): LevelConfig => ({
  id: levelId,
  chapterNumber: chapterNumber,
  mazeConfig: {
    type: MazeType.LINEAR,
    difficulty: 1,
    width: 20,
    height: 20,
    layers: 1,
    obstacleCount: 5,
    collectibleCount: 3,
  },
  requiredPuzzles: [],
});

// Helper to create level stats
const createLevelStats = (completionTime: number, hintsUsed: number): LevelStats => ({
  completionTime,
  hintsUsed,
  abilitiesUsed: new Map<AbilityType, number>(),
  deaths: 0,
});

// Feature: chain-ledge-game, Property 16: Level completion triggers progression
// Validates: Requirements 4.4, 8.1

describe('LevelManager Property Tests', () => {
  describe('Property 16: Level completion triggers progression', () => {
    test('Completing a level marks it as complete and unlocks the next level', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // chapter number
          fc.integer({ min: 2, max: 10 }), // number of levels in chapter
          fc.integer({ min: 0, max: 9 }), // which level to complete (0-indexed)
          (chapterNumber, levelCount, levelToComplete) => {
            // Ensure levelToComplete is within bounds
            const completionIndex = levelToComplete % levelCount;
            
            const manager = new LevelManager();
            
            // Create sequential level configs
            const configs: LevelConfig[] = [];
            for (let i = 0; i < levelCount; i++) {
              const levelId = `chapter${chapterNumber}-level${i}`;
              configs.push(createLevelConfig(levelId, chapterNumber));
            }
            
            // Initialize manager
            manager.initialize(configs);
            
            // Get the level to complete
            const levelId = configs[completionIndex].id;
            
            // Complete the level
            manager.completeLevel(levelId, createLevelStats(5000, 0));
            
            // Verify level is marked as complete
            const progress = manager.getLevelProgress(levelId);
            expect(progress).not.toBeNull();
            expect(progress!.completed).toBe(true);
            expect(progress!.attempts).toBeGreaterThan(0);
            
            // Verify next level is unlocked (if not the last level)
            if (completionIndex < levelCount - 1) {
              const nextLevelId = configs[completionIndex + 1].id;
              expect(manager.isLevelUnlocked(nextLevelId)).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Completing a level updates best time if faster', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000 }), // first completion time
          fc.integer({ min: 1000, max: 10000 }), // second completion time
          (time1, time2) => {
            const manager = new LevelManager();
            const levelId = 'test-level';
            
            const config = createLevelConfig(levelId, 1);
            manager.initialize([config]);
            
            // First completion
            manager.completeLevel(levelId, createLevelStats(time1, 0));
            
            const progress1 = manager.getLevelProgress(levelId);
            expect(progress1!.bestTime).toBe(time1);
            
            // Second completion
            manager.completeLevel(levelId, createLevelStats(time2, 0));
            
            const progress2 = manager.getLevelProgress(levelId);
            expect(progress2!.bestTime).toBe(Math.min(time1, time2));
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Completing a level increments attempt counter', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // number of completions
          (completionCount) => {
            const manager = new LevelManager();
            const levelId = 'test-level';
            
            const config = createLevelConfig(levelId, 1);
            manager.initialize([config]);
            
            // Complete the level multiple times
            for (let i = 0; i < completionCount; i++) {
              manager.completeLevel(levelId, createLevelStats(5000, 0));
            }
            
            const progress = manager.getLevelProgress(levelId);
            expect(progress!.attempts).toBe(completionCount);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Completing all levels in sequence unlocks them all', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // number of levels
          (levelCount) => {
            const manager = new LevelManager();
            const chapterNumber = 1;
            
            // Create sequential level configs
            const configs: LevelConfig[] = [];
            for (let i = 0; i < levelCount; i++) {
              const levelId = `level${i}`;
              configs.push(createLevelConfig(levelId, chapterNumber));
            }
            
            manager.initialize(configs);
            
            // Complete all levels in sequence
            for (let i = 0; i < levelCount; i++) {
              manager.completeLevel(configs[i].id, createLevelStats(5000, 0));
            }
            
            // Verify all levels are unlocked and completed
            for (let i = 0; i < levelCount; i++) {
              expect(manager.isLevelUnlocked(configs[i].id)).toBe(true);
              const progress = manager.getLevelProgress(configs[i].id);
              expect(progress!.completed).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: chain-ledge-game, Property 26: Chapter progression
  // Validates: Requirements 8.2

  describe('Property 26: Chapter progression', () => {
    test('Completing all levels in a chapter unlocks the next chapter', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }), // levels per chapter
          fc.integer({ min: 2, max: 4 }), // number of chapters
          (levelsPerChapter, chapterCount) => {
            const manager = new LevelManager();
            
            // Create multiple chapters with levels
            const configs: LevelConfig[] = [];
            for (let chapter = 1; chapter <= chapterCount; chapter++) {
              for (let level = 0; level < levelsPerChapter; level++) {
                const levelId = `chapter${chapter}-level${level}`;
                configs.push(createLevelConfig(levelId, chapter));
              }
            }
            
            manager.initialize(configs);
            
            // Complete all levels in chapter 1
            for (let level = 0; level < levelsPerChapter; level++) {
              const levelId = `chapter1-level${level}`;
              manager.completeLevel(levelId, createLevelStats(5000, 0));
            }
            
            // Verify chapter 2 is now unlocked
            expect(manager.isChapterUnlocked(2)).toBe(true);
            
            // Verify first level of chapter 2 is unlocked
            const firstLevelChapter2 = `chapter2-level0`;
            expect(manager.isLevelUnlocked(firstLevelChapter2)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Partially completing a chapter does not unlock the next chapter', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }), // levels per chapter
          (levelsPerChapter) => {
            const manager = new LevelManager();
            
            // Create two chapters
            const configs: LevelConfig[] = [];
            for (let chapter = 1; chapter <= 2; chapter++) {
              for (let level = 0; level < levelsPerChapter; level++) {
                const levelId = `chapter${chapter}-level${level}`;
                configs.push(createLevelConfig(levelId, chapter));
              }
            }
            
            manager.initialize(configs);
            
            // Complete only some levels in chapter 1 (not all)
            const levelsToComplete = Math.floor(levelsPerChapter / 2);
            for (let level = 0; level < levelsToComplete; level++) {
              const levelId = `chapter1-level${level}`;
              manager.completeLevel(levelId, createLevelStats(5000, 0));
            }
            
            // Verify chapter 2 first level is NOT unlocked (chapter not complete)
            const firstLevelChapter2 = `chapter2-level0`;
            expect(manager.isLevelUnlocked(firstLevelChapter2)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Completing chapters in sequence unlocks all subsequent chapters', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 4 }), // levels per chapter
          fc.integer({ min: 2, max: 4 }), // number of chapters to complete
          (levelsPerChapter, chaptersToComplete) => {
            const manager = new LevelManager();
            const totalChapters = chaptersToComplete + 1; // One extra to test unlocking
            
            // Create multiple chapters
            const configs: LevelConfig[] = [];
            for (let chapter = 1; chapter <= totalChapters; chapter++) {
              for (let level = 0; level < levelsPerChapter; level++) {
                const levelId = `chapter${chapter}-level${level}`;
                configs.push(createLevelConfig(levelId, chapter));
              }
            }
            
            manager.initialize(configs);
            
            // Complete all levels in the first N chapters
            for (let chapter = 1; chapter <= chaptersToComplete; chapter++) {
              for (let level = 0; level < levelsPerChapter; level++) {
                const levelId = `chapter${chapter}-level${level}`;
                manager.completeLevel(levelId, createLevelStats(5000, 0));
              }
            }
            
            // Verify all completed chapters are unlocked
            for (let chapter = 1; chapter <= chaptersToComplete; chapter++) {
              expect(manager.isChapterUnlocked(chapter)).toBe(true);
            }
            
            // Verify next chapter is unlocked
            if (totalChapters > chaptersToComplete) {
              expect(manager.isChapterUnlocked(chaptersToComplete + 1)).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Chapter unlock only affects first level of next chapter', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }), // levels per chapter
          (levelsPerChapter) => {
            const manager = new LevelManager();
            
            // Create two chapters
            const configs: LevelConfig[] = [];
            for (let chapter = 1; chapter <= 2; chapter++) {
              for (let level = 0; level < levelsPerChapter; level++) {
                const levelId = `chapter${chapter}-level${level}`;
                configs.push(createLevelConfig(levelId, chapter));
              }
            }
            
            manager.initialize(configs);
            
            // Complete all levels in chapter 1
            for (let level = 0; level < levelsPerChapter; level++) {
              const levelId = `chapter1-level${level}`;
              manager.completeLevel(levelId, createLevelStats(5000, 0));
            }
            
            // Verify only first level of chapter 2 is unlocked
            expect(manager.isLevelUnlocked(`chapter2-level0`)).toBe(true);
            
            // Verify other levels in chapter 2 are NOT unlocked
            for (let level = 1; level < levelsPerChapter; level++) {
              expect(manager.isLevelUnlocked(`chapter2-level${level}`)).toBe(false);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: chain-ledge-game, Property 27: Level list accuracy
  // Validates: Requirements 8.3

  describe('Property 27: Level list accuracy', () => {
    test('Level selection data matches unlocked levels exactly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // total levels
          fc.integer({ min: 0, max: 7 }), // levels to unlock
          (totalLevels, levelsToUnlock) => {
            // Ensure levelsToUnlock doesn't exceed totalLevels
            const actualUnlockCount = Math.min(levelsToUnlock, totalLevels - 1);
            
            const manager = new LevelManager();
            
            // Create level configs
            const configs: LevelConfig[] = [];
            for (let i = 0; i < totalLevels; i++) {
              const levelId = `level${i}`;
              configs.push(createLevelConfig(levelId, 1));
            }
            
            manager.initialize(configs);
            
            // Complete some levels to unlock more
            for (let i = 0; i <= actualUnlockCount; i++) {
              manager.completeLevel(configs[i].id, createLevelStats(5000, 0));
            }
            
            // Get level selection data
            const selectionData = manager.getLevelSelectionData();
            const unlockedLevels = manager.getUnlockedLevels();
            
            // Verify counts match
            expect(selectionData.length).toBe(unlockedLevels.length);
            
            // Verify all unlocked levels are in selection data
            const selectionLevelIds = selectionData.map(p => p.levelId);
            for (const levelId of unlockedLevels) {
              expect(selectionLevelIds).toContain(levelId);
            }
            
            // Verify all selection data levels are unlocked
            for (const progress of selectionData) {
              expect(unlockedLevels).toContain(progress.levelId);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Level selection data contains accurate progress information', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 6 }), // number of levels
          fc.array(fc.integer({ min: 1000, max: 10000 }), { minLength: 2, maxLength: 6 }), // completion times
          fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 2, maxLength: 6 }), // hints used
          (levelCount, completionTimes, hintsUsed) => {
            const manager = new LevelManager();
            
            // Create level configs
            const configs: LevelConfig[] = [];
            for (let i = 0; i < levelCount; i++) {
              const levelId = `level${i}`;
              configs.push(createLevelConfig(levelId, 1));
            }
            
            manager.initialize(configs);
            
            // Complete levels with specific stats
            for (let i = 0; i < levelCount; i++) {
              const time = completionTimes[i % completionTimes.length];
              const hints = hintsUsed[i % hintsUsed.length];
              manager.completeLevel(configs[i].id, createLevelStats(time, hints));
            }
            
            // Get selection data
            const selectionData = manager.getLevelSelectionData();
            
            // Verify each level's progress data is accurate
            for (let i = 0; i < levelCount; i++) {
              const levelId = configs[i].id;
              const selectionProgress = selectionData.find(p => p.levelId === levelId);
              const actualProgress = manager.getLevelProgress(levelId);
              
              expect(selectionProgress).toBeDefined();
              expect(actualProgress).toBeDefined();
              
              // Verify data matches
              expect(selectionProgress!.completed).toBe(actualProgress!.completed);
              expect(selectionProgress!.attempts).toBe(actualProgress!.attempts);
              expect(selectionProgress!.bestTime).toBe(actualProgress!.bestTime);
              expect(selectionProgress!.hintsUsed).toBe(actualProgress!.hintsUsed);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Level selection data updates when new levels are unlocked', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 8 }), // total levels
          (totalLevels) => {
            const manager = new LevelManager();
            
            // Create level configs
            const configs: LevelConfig[] = [];
            for (let i = 0; i < totalLevels; i++) {
              const levelId = `level${i}`;
              configs.push(createLevelConfig(levelId, 1));
            }
            
            manager.initialize(configs);
            
            // Initially only first level is unlocked
            let selectionData = manager.getLevelSelectionData();
            const initialCount = selectionData.length;
            
            // Complete levels one by one and verify selection data grows
            for (let i = 0; i < totalLevels - 1; i++) {
              manager.completeLevel(configs[i].id, createLevelStats(5000, 0));
              
              selectionData = manager.getLevelSelectionData();
              
              // Selection data should have grown
              expect(selectionData.length).toBeGreaterThan(initialCount + i);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Level selection data reflects completion status accurately', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 8 }), // total levels
          fc.integer({ min: 1, max: 7 }), // levels to complete
          (totalLevels, levelsToComplete) => {
            const actualCompleteCount = Math.min(levelsToComplete, totalLevels);
            
            const manager = new LevelManager();
            
            // Create level configs
            const configs: LevelConfig[] = [];
            for (let i = 0; i < totalLevels; i++) {
              const levelId = `level${i}`;
              configs.push(createLevelConfig(levelId, 1));
            }
            
            manager.initialize(configs);
            
            // Complete some levels
            for (let i = 0; i < actualCompleteCount; i++) {
              manager.completeLevel(configs[i].id, createLevelStats(5000, 0));
            }
            
            // Get selection data
            const selectionData = manager.getLevelSelectionData();
            
            // Count completed levels in selection data
            const completedInSelection = selectionData.filter(p => p.completed).length;
            
            // Should match actual completed count
            expect(completedInSelection).toBe(actualCompleteCount);
            
            // Verify specific levels
            for (let i = 0; i < actualCompleteCount; i++) {
              const progress = selectionData.find(p => p.levelId === configs[i].id);
              expect(progress).toBeDefined();
              expect(progress!.completed).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
