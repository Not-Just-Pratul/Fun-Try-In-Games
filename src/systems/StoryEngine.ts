import { Memory, LoreItem, CinematicData } from '../types/story';

export interface StoryEngineConfig {
  memories: Memory[];
  loreItems: LoreItem[];
}

export class StoryEngine {
  private currentChapter: number = 1;
  private unlockedMemories: Set<string> = new Set();
  private loreCollection: Set<string> = new Set();
  private allMemories: Map<string, Memory> = new Map();
  private allLoreItems: Map<string, LoreItem> = new Map();
  private isNarrativeActive: boolean = false;
  private currentNarrative: Memory | null = null;

  constructor(config: StoryEngineConfig) {
    // Initialize memories map
    config.memories.forEach(memory => {
      this.allMemories.set(memory.id, memory);
    });

    // Initialize lore items map
    config.loreItems.forEach(lore => {
      this.allLoreItems.set(lore.id, lore);
    });
  }

  /**
   * Unlocks a memory fragment based on level completion
   * @param levelId The ID of the completed level
   * @returns The unlocked memory, or null if no memory is associated
   */
  unlockMemory(levelId: string): Memory | null {
    // Find memory associated with this level
    const memory = Array.from(this.allMemories.values()).find(
      m => m.id === levelId || m.id.startsWith(`${levelId}_`)
    );

    if (memory && !this.unlockedMemories.has(memory.id)) {
      this.unlockedMemories.add(memory.id);
      return memory;
    }

    return null;
  }

  /**
   * Adds a lore item to the player's collection
   * @param itemId The ID of the lore item to add
   * @returns true if the item was added, false if already collected
   */
  addLoreItem(itemId: string): boolean {
    if (this.loreCollection.has(itemId)) {
      return false;
    }

    const loreItem = this.allLoreItems.get(itemId);
    if (loreItem) {
      this.loreCollection.add(itemId);
      return true;
    }

    return false;
  }

  /**
   * Displays narrative content and pauses gameplay
   * @param memory The memory to display
   */
  displayNarrative(memory: Memory): void {
    this.isNarrativeActive = true;
    this.currentNarrative = memory;
  }

  /**
   * Skips the current narrative and resumes gameplay
   */
  skipNarrative(): void {
    this.isNarrativeActive = false;
    this.currentNarrative = null;
  }

  /**
   * Replays the current narrative from the beginning
   */
  replayNarrative(): void {
    if (this.currentNarrative) {
      // Reset narrative state to beginning
      // This would be handled by the UI layer
      this.isNarrativeActive = true;
    }
  }

  /**
   * Checks if all levels in the current chapter are complete
   * @param completedLevels Set of completed level IDs
   * @param levelsInChapter Array of level IDs in the current chapter
   * @returns true if all chapter levels are complete
   */
  isChapterComplete(completedLevels: Set<string>, levelsInChapter: string[]): boolean {
    return levelsInChapter.every(levelId => completedLevels.has(levelId));
  }

  /**
   * Gets the chapter cutscene for a completed chapter
   * @param chapterNumber The chapter number
   * @returns The chapter cutscene memory, or null if not found
   */
  getChapterCutscene(chapterNumber: number): Memory | null {
    const cutscene = Array.from(this.allMemories.values()).find(
      m => m.chapterNumber === chapterNumber && m.cinematicData !== undefined
    );

    return cutscene || null;
  }

  /**
   * Advances to the next chapter
   */
  advanceChapter(): void {
    this.currentChapter++;
  }

  /**
   * Gets the current chapter number
   */
  getCurrentChapter(): number {
    return this.currentChapter;
  }

  /**
   * Sets the current chapter (used for loading saved games)
   */
  setCurrentChapter(chapter: number): void {
    this.currentChapter = chapter;
  }

  /**
   * Checks if narrative is currently being displayed
   */
  isNarrativeDisplayed(): boolean {
    return this.isNarrativeActive;
  }

  /**
   * Gets the currently displayed narrative
   */
  getCurrentNarrative(): Memory | null {
    return this.currentNarrative;
  }

  /**
   * Gets all unlocked memories
   */
  getUnlockedMemories(): Memory[] {
    return Array.from(this.unlockedMemories)
      .map(id => this.allMemories.get(id))
      .filter((m): m is Memory => m !== undefined);
  }

  /**
   * Gets all collected lore items
   */
  getCollectedLore(): LoreItem[] {
    return Array.from(this.loreCollection)
      .map(id => this.allLoreItems.get(id))
      .filter((l): l is LoreItem => l !== undefined);
  }

  /**
   * Gets a specific lore item by ID
   */
  getLoreItem(itemId: string): LoreItem | undefined {
    return this.allLoreItems.get(itemId);
  }

  /**
   * Checks if a specific memory is unlocked
   */
  isMemoryUnlocked(memoryId: string): boolean {
    return this.unlockedMemories.has(memoryId);
  }

  /**
   * Checks if a specific lore item is collected
   */
  isLoreCollected(loreId: string): boolean {
    return this.loreCollection.has(loreId);
  }

  /**
   * Loads story state from saved data
   */
  loadState(data: {
    currentChapter: number;
    unlockedMemories: string[];
    loreCollection: string[];
  }): void {
    this.currentChapter = data.currentChapter;
    this.unlockedMemories = new Set(data.unlockedMemories);
    this.loreCollection = new Set(data.loreCollection);
  }

  /**
   * Exports story state for saving
   */
  exportState(): {
    currentChapter: number;
    unlockedMemories: string[];
    loreCollection: string[];
  } {
    return {
      currentChapter: this.currentChapter,
      unlockedMemories: Array.from(this.unlockedMemories),
      loreCollection: Array.from(this.loreCollection),
    };
  }
}
