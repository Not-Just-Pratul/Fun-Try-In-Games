import * as fc from 'fast-check';
import { StoryEngine, StoryEngineConfig } from '@systems/StoryEngine';
import { Memory, LoreItem } from '@game-types/story';

// Helper to create a memory
const createMemory = (id: string, chapterNumber: number, hasCinematic: boolean = false): Memory => ({
  id,
  chapterNumber,
  title: `Memory ${id}`,
  content: `Content for memory ${id}`,
  cinematicData: hasCinematic ? {
    duration: 5000,
    scenes: [
      { text: 'Scene 1', duration: 2500 },
      { text: 'Scene 2', duration: 2500 },
    ],
  } : undefined,
});

// Helper to create a lore item
const createLoreItem = (id: string): LoreItem => ({
  id,
  title: `Lore ${id}`,
  description: `Description for lore ${id}`,
  unlockCondition: `Complete level ${id}`,
});

// Helper to create a story engine config
const createStoryConfig = (memoryCount: number, loreCount: number, chaptersWithCutscenes: number[] = []): StoryEngineConfig => {
  const memories: Memory[] = [];
  const loreItems: LoreItem[] = [];

  // Create memories
  for (let i = 0; i < memoryCount; i++) {
    const chapterNumber = Math.floor(i / 3) + 1; // 3 memories per chapter
    const isLastInChapter = i % 3 === 2; // Last memory of chapter
    const hasCinematic = chaptersWithCutscenes.includes(chapterNumber) && isLastInChapter;
    memories.push(createMemory(`memory${i}`, chapterNumber, hasCinematic));
  }

  // Add explicit cutscene memories for chapters that need them
  for (const chapter of chaptersWithCutscenes) {
    // Only add if we don't already have enough memories for this chapter
    const memoriesForChapter = memories.filter(m => m.chapterNumber === chapter);
    if (memoriesForChapter.length === 0 || !memoriesForChapter.some(m => m.cinematicData)) {
      memories.push(createMemory(`cutscene-chapter${chapter}`, chapter, true));
    }
  }

  // Create lore items
  for (let i = 0; i < loreCount; i++) {
    loreItems.push(createLoreItem(`lore${i}`));
  }

  return { memories, loreItems };
};

// Feature: chain-ledge-game, Property 17: Memory unlock on level completion
// Validates: Requirements 5.1

describe('StoryEngine Property Tests', () => {
  describe('Property 17: Memory unlock on level completion', () => {
    test('Unlocking a memory adds it to unlocked memories collection', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }), // number of memories
          fc.integer({ min: 0, max: 9 }), // which memory to unlock
          (memoryCount, memoryToUnlock) => {
            const unlockIndex = memoryToUnlock % memoryCount;
            const config = createStoryConfig(memoryCount, 0);
            const engine = new StoryEngine(config);

            const memoryId = `memory${unlockIndex}`;
            
            // Unlock the memory
            const unlockedMemory = engine.unlockMemory(memoryId);

            // Verify memory was unlocked
            expect(unlockedMemory).not.toBeNull();
            expect(unlockedMemory!.id).toBe(memoryId);
            expect(engine.isMemoryUnlocked(memoryId)).toBe(true);

            // Verify it's in the unlocked collection
            const unlockedMemories = engine.getUnlockedMemories();
            expect(unlockedMemories).toContainEqual(unlockedMemory);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Unlocking the same memory twice does not duplicate it', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // number of memories
          fc.integer({ min: 0, max: 7 }), // which memory to unlock
          (memoryCount, memoryToUnlock) => {
            const unlockIndex = memoryToUnlock % memoryCount;
            const config = createStoryConfig(memoryCount, 0);
            const engine = new StoryEngine(config);

            const memoryId = `memory${unlockIndex}`;
            
            // Unlock the memory twice
            const firstUnlock = engine.unlockMemory(memoryId);
            const secondUnlock = engine.unlockMemory(memoryId);

            // First unlock should succeed
            expect(firstUnlock).not.toBeNull();
            
            // Second unlock should return null (already unlocked)
            expect(secondUnlock).toBeNull();

            // Verify only one copy in collection
            const unlockedMemories = engine.getUnlockedMemories();
            const matchingMemories = unlockedMemories.filter(m => m.id === memoryId);
            expect(matchingMemories.length).toBe(1);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Unlocking multiple memories adds all to collection', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }), // total memories
          fc.integer({ min: 1, max: 9 }), // memories to unlock
          (totalMemories, memoriesToUnlock) => {
            const unlockCount = Math.min(memoriesToUnlock, totalMemories);
            const config = createStoryConfig(totalMemories, 0);
            const engine = new StoryEngine(config);

            // Unlock multiple memories
            for (let i = 0; i < unlockCount; i++) {
              engine.unlockMemory(`memory${i}`);
            }

            // Verify all are unlocked
            const unlockedMemories = engine.getUnlockedMemories();
            expect(unlockedMemories.length).toBe(unlockCount);

            // Verify each specific memory is unlocked
            for (let i = 0; i < unlockCount; i++) {
              expect(engine.isMemoryUnlocked(`memory${i}`)).toBe(true);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Unlocking non-existent memory returns null', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // number of memories
          (memoryCount) => {
            const config = createStoryConfig(memoryCount, 0);
            const engine = new StoryEngine(config);

            // Try to unlock a memory that doesn't exist
            const nonExistentId = `memory${memoryCount + 100}`;
            const result = engine.unlockMemory(nonExistentId);

            expect(result).toBeNull();
            expect(engine.isMemoryUnlocked(nonExistentId)).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: chain-ledge-game, Property 19: Chapter completion triggers cutscene
  // Validates: Requirements 5.3

  describe('Property 19: Chapter completion triggers cutscene', () => {
    test('Completing all levels in a chapter returns the chapter cutscene', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }), // levels per chapter
          fc.integer({ min: 1, max: 4 }), // chapter number
          (levelsPerChapter, chapterNumber) => {
            // Create config with cutscenes for each chapter
            const config = createStoryConfig(levelsPerChapter * chapterNumber, 0, [chapterNumber]);
            const engine = new StoryEngine(config);

            // Create level IDs for the chapter
            const levelIds: string[] = [];
            for (let i = 0; i < levelsPerChapter; i++) {
              levelIds.push(`chapter${chapterNumber}-level${i}`);
            }

            // Mark all levels as completed
            const completedLevels = new Set(levelIds);

            // Check if chapter is complete
            const isComplete = engine.isChapterComplete(completedLevels, levelIds);
            expect(isComplete).toBe(true);

            // Get chapter cutscene
            const cutscene = engine.getChapterCutscene(chapterNumber);
            
            // Verify cutscene exists and has cinematic data
            expect(cutscene).not.toBeNull();
            expect(cutscene!.chapterNumber).toBe(chapterNumber);
            expect(cutscene!.cinematicData).toBeDefined();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Partially completing a chapter does not trigger cutscene availability', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }), // levels per chapter
          fc.integer({ min: 1, max: 4 }), // chapter number
          (levelsPerChapter, chapterNumber) => {
            const config = createStoryConfig(levelsPerChapter * chapterNumber, 0, [chapterNumber]);
            const engine = new StoryEngine(config);

            // Create level IDs for the chapter
            const levelIds: string[] = [];
            for (let i = 0; i < levelsPerChapter; i++) {
              levelIds.push(`chapter${chapterNumber}-level${i}`);
            }

            // Mark only some levels as completed (not all)
            const completedCount = Math.floor(levelsPerChapter / 2);
            const completedLevels = new Set(levelIds.slice(0, completedCount));

            // Check if chapter is complete
            const isComplete = engine.isChapterComplete(completedLevels, levelIds);
            expect(isComplete).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Chapter cutscene has valid cinematic data', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }), // chapter number
          (chapterNumber) => {
            const config = createStoryConfig(9, 0, [1, 2, 3, 4]); // 3 memories per chapter, all have cutscenes
            const engine = new StoryEngine(config);

            const cutscene = engine.getChapterCutscene(chapterNumber);

            if (cutscene && cutscene.cinematicData) {
              // Verify cinematic data structure
              expect(cutscene.cinematicData.duration).toBeGreaterThan(0);
              expect(cutscene.cinematicData.scenes).toBeDefined();
              expect(cutscene.cinematicData.scenes.length).toBeGreaterThan(0);

              // Verify each scene has required properties
              for (const scene of cutscene.cinematicData.scenes) {
                expect(scene.text).toBeDefined();
                expect(scene.duration).toBeGreaterThan(0);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Getting cutscene for non-existent chapter returns null', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }), // number of chapters with cutscenes
          (chapterCount) => {
            const config = createStoryConfig(chapterCount * 3, 0, Array.from({ length: chapterCount }, (_, i) => i + 1));
            const engine = new StoryEngine(config);

            // Try to get cutscene for a chapter that doesn't exist
            const nonExistentChapter = chapterCount + 10;
            const cutscene = engine.getChapterCutscene(nonExistentChapter);

            expect(cutscene).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: chain-ledge-game, Property 20: Gameplay pause during narrative
  // Validates: Requirements 5.4

  describe('Property 20: Gameplay pause during narrative', () => {
    test('Displaying narrative sets active state and pauses gameplay', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // number of memories
          fc.integer({ min: 0, max: 7 }), // which memory to display
          (memoryCount, memoryToDisplay) => {
            const displayIndex = memoryToDisplay % memoryCount;
            const config = createStoryConfig(memoryCount, 0);
            const engine = new StoryEngine(config);

            // Initially narrative should not be active
            expect(engine.isNarrativeDisplayed()).toBe(false);
            expect(engine.getCurrentNarrative()).toBeNull();

            // Display a narrative
            const memory = createMemory(`memory${displayIndex}`, 1);
            engine.displayNarrative(memory);

            // Verify narrative is now active
            expect(engine.isNarrativeDisplayed()).toBe(true);
            expect(engine.getCurrentNarrative()).toEqual(memory);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Skipping narrative clears active state and resumes gameplay', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // number of memories
          fc.integer({ min: 0, max: 7 }), // which memory to display
          (memoryCount, memoryToDisplay) => {
            const displayIndex = memoryToDisplay % memoryCount;
            const config = createStoryConfig(memoryCount, 0);
            const engine = new StoryEngine(config);

            // Display a narrative
            const memory = createMemory(`memory${displayIndex}`, 1);
            engine.displayNarrative(memory);

            // Verify narrative is active
            expect(engine.isNarrativeDisplayed()).toBe(true);

            // Skip the narrative
            engine.skipNarrative();

            // Verify narrative is no longer active
            expect(engine.isNarrativeDisplayed()).toBe(false);
            expect(engine.getCurrentNarrative()).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Replaying narrative maintains active state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // number of memories
          fc.integer({ min: 0, max: 7 }), // which memory to display
          (memoryCount, memoryToDisplay) => {
            const displayIndex = memoryToDisplay % memoryCount;
            const config = createStoryConfig(memoryCount, 0);
            const engine = new StoryEngine(config);

            // Display a narrative
            const memory = createMemory(`memory${displayIndex}`, 1);
            engine.displayNarrative(memory);

            // Replay the narrative
            engine.replayNarrative();

            // Verify narrative is still active
            expect(engine.isNarrativeDisplayed()).toBe(true);
            expect(engine.getCurrentNarrative()).toEqual(memory);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Multiple display calls update current narrative', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 8 }), // number of memories
          (memoryCount) => {
            const config = createStoryConfig(memoryCount, 0);
            const engine = new StoryEngine(config);

            // Display first narrative
            const memory1 = createMemory('memory0', 1);
            engine.displayNarrative(memory1);
            expect(engine.getCurrentNarrative()).toEqual(memory1);

            // Display second narrative
            const memory2 = createMemory('memory1', 1);
            engine.displayNarrative(memory2);
            expect(engine.getCurrentNarrative()).toEqual(memory2);

            // Verify still in narrative mode
            expect(engine.isNarrativeDisplayed()).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional property tests for lore collection

  describe('Lore Collection Properties', () => {
    test('Adding lore items increases collection size', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }), // number of lore items
          fc.integer({ min: 1, max: 9 }), // items to collect
          (totalLore, itemsToCollect) => {
            const collectCount = Math.min(itemsToCollect, totalLore);
            const config = createStoryConfig(0, totalLore);
            const engine = new StoryEngine(config);

            // Collect lore items
            for (let i = 0; i < collectCount; i++) {
              const added = engine.addLoreItem(`lore${i}`);
              expect(added).toBe(true);
            }

            // Verify collection size
            const collectedLore = engine.getCollectedLore();
            expect(collectedLore.length).toBe(collectCount);

            // Verify each item is marked as collected
            for (let i = 0; i < collectCount; i++) {
              expect(engine.isLoreCollected(`lore${i}`)).toBe(true);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Adding same lore item twice does not duplicate', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // number of lore items
          fc.integer({ min: 0, max: 7 }), // which item to collect
          (totalLore, itemToCollect) => {
            const collectIndex = itemToCollect % totalLore;
            const config = createStoryConfig(0, totalLore);
            const engine = new StoryEngine(config);

            const loreId = `lore${collectIndex}`;

            // Add lore item twice
            const firstAdd = engine.addLoreItem(loreId);
            const secondAdd = engine.addLoreItem(loreId);

            // First add should succeed
            expect(firstAdd).toBe(true);
            
            // Second add should fail (already collected)
            expect(secondAdd).toBe(false);

            // Verify only one copy in collection
            const collectedLore = engine.getCollectedLore();
            const matchingLore = collectedLore.filter(l => l.id === loreId);
            expect(matchingLore.length).toBe(1);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Getting lore item returns correct data', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // number of lore items
          fc.integer({ min: 0, max: 7 }), // which item to get
          (totalLore, itemToGet) => {
            const getIndex = itemToGet % totalLore;
            const config = createStoryConfig(0, totalLore);
            const engine = new StoryEngine(config);

            const loreId = `lore${getIndex}`;
            const loreItem = engine.getLoreItem(loreId);

            expect(loreItem).toBeDefined();
            expect(loreItem!.id).toBe(loreId);
            expect(loreItem!.title).toBe(`Lore ${loreId}`);
            expect(loreItem!.description).toBeDefined();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // State persistence tests

  describe('State Persistence Properties', () => {
    test('Export and load state preserves all data', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 8 }), // memories
          fc.integer({ min: 2, max: 6 }), // lore items
          fc.integer({ min: 1, max: 4 }), // chapter number
          fc.integer({ min: 1, max: 7 }), // memories to unlock
          fc.integer({ min: 1, max: 5 }), // lore to collect
          (memoryCount, loreCount, chapter, memoriesToUnlock, loreToCollect) => {
            const unlockCount = Math.min(memoriesToUnlock, memoryCount);
            const collectCount = Math.min(loreToCollect, loreCount);

            const config = createStoryConfig(memoryCount, loreCount);
            const engine1 = new StoryEngine(config);

            // Set up state
            engine1.setCurrentChapter(chapter);
            for (let i = 0; i < unlockCount; i++) {
              engine1.unlockMemory(`memory${i}`);
            }
            for (let i = 0; i < collectCount; i++) {
              engine1.addLoreItem(`lore${i}`);
            }

            // Export state
            const state = engine1.exportState();

            // Create new engine and load state
            const engine2 = new StoryEngine(config);
            engine2.loadState(state);

            // Verify all data is preserved
            expect(engine2.getCurrentChapter()).toBe(chapter);
            expect(engine2.getUnlockedMemories().length).toBe(unlockCount);
            expect(engine2.getCollectedLore().length).toBe(collectCount);

            // Verify specific items
            for (let i = 0; i < unlockCount; i++) {
              expect(engine2.isMemoryUnlocked(`memory${i}`)).toBe(true);
            }
            for (let i = 0; i < collectCount; i++) {
              expect(engine2.isLoreCollected(`lore${i}`)).toBe(true);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Chapter advancement increments chapter number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // starting chapter
          fc.integer({ min: 1, max: 4 }), // chapters to advance
          (startChapter, chaptersToAdvance) => {
            const config = createStoryConfig(10, 5);
            const engine = new StoryEngine(config);

            engine.setCurrentChapter(startChapter);

            // Advance chapters
            for (let i = 0; i < chaptersToAdvance; i++) {
              engine.advanceChapter();
            }

            // Verify chapter number
            expect(engine.getCurrentChapter()).toBe(startChapter + chaptersToAdvance);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
