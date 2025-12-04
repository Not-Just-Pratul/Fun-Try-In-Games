import { LevelConfig, LevelProgress, LevelStats } from '../types/level';
import { GameSaveData } from '../types/save';

/**
 * LevelManager handles level progression, unlocking, and statistics tracking.
 * Manages the player's journey through chapters and levels.
 */
export class LevelManager {
  private levelProgress: Map<string, LevelProgress>;
  private currentLevel: string;
  private currentChapter: number;
  private levelConfigs: Map<string, LevelConfig>;
  private chapterLevels: Map<number, string[]>;

  constructor() {
    this.levelProgress = new Map();
    this.currentLevel = '';
    this.currentChapter = 1;
    this.levelConfigs = new Map();
    this.chapterLevels = new Map();
  }

  /**
   * Initialize the level manager with level configurations
   */
  public initialize(configs: LevelConfig[]): void {
    this.levelConfigs.clear();
    this.chapterLevels.clear();

    // Organize levels by chapter
    for (const config of configs) {
      this.levelConfigs.set(config.id, config);
      
      if (!this.chapterLevels.has(config.chapterNumber)) {
        this.chapterLevels.set(config.chapterNumber, []);
      }
      this.chapterLevels.get(config.chapterNumber)!.push(config.id);
    }

    // Sort levels within each chapter
    for (const [chapter, levels] of this.chapterLevels.entries()) {
      levels.sort();
      this.chapterLevels.set(chapter, levels);
    }

    // Initialize first level if no progress exists
    if (this.levelProgress.size === 0 && configs.length > 0) {
      const firstLevel = this.getFirstLevel();
      if (firstLevel) {
        this.currentLevel = firstLevel;
        this.currentChapter = this.levelConfigs.get(firstLevel)!.chapterNumber;
      }
    }
  }

  /**
   * Load a level configuration by ID
   */
  public loadLevel(levelId: string): LevelConfig | null {
    return this.levelConfigs.get(levelId) || null;
  }

  /**
   * Complete a level and update progression
   */
  public completeLevel(levelId: string, stats: LevelStats): void {
    const config = this.levelConfigs.get(levelId);
    if (!config) {
      throw new Error(`Level ${levelId} not found`);
    }

    // Get or create progress entry
    let progress = this.levelProgress.get(levelId);
    if (!progress) {
      progress = {
        levelId,
        completed: false,
        attempts: 0,
        bestTime: Infinity,
        hintsUsed: 0,
        collectiblesFound: 0,
      };
      this.levelProgress.set(levelId, progress);
    }

    // Update progress
    progress.completed = true;
    progress.attempts += 1;
    progress.bestTime = Math.min(progress.bestTime, stats.completionTime);
    progress.hintsUsed += stats.hintsUsed;

    // Unlock next level
    this.unlockNextLevel(levelId);

    // Check if chapter is complete
    if (this.isChapterComplete(config.chapterNumber)) {
      this.unlockNextChapter(config.chapterNumber);
    }
  }

  /**
   * Unlock the next level in sequence
   */
  private unlockNextLevel(completedLevelId: string): void {
    const config = this.levelConfigs.get(completedLevelId);
    if (!config) return;

    const chapterLevels = this.chapterLevels.get(config.chapterNumber);
    if (!chapterLevels) return;

    const currentIndex = chapterLevels.indexOf(completedLevelId);
    if (currentIndex >= 0 && currentIndex < chapterLevels.length - 1) {
      const nextLevelId = chapterLevels[currentIndex + 1];
      
      // Ensure next level has a progress entry (unlocked)
      if (!this.levelProgress.has(nextLevelId)) {
        this.levelProgress.set(nextLevelId, {
          levelId: nextLevelId,
          completed: false,
          attempts: 0,
          bestTime: Infinity,
          hintsUsed: 0,
          collectiblesFound: 0,
        });
      }
    }
  }

  /**
   * Check if all levels in a chapter are complete
   */
  private isChapterComplete(chapterNumber: number): boolean {
    const chapterLevels = this.chapterLevels.get(chapterNumber);
    if (!chapterLevels) return false;

    return chapterLevels.every(levelId => {
      const progress = this.levelProgress.get(levelId);
      return progress && progress.completed;
    });
  }

  /**
   * Unlock the next chapter
   */
  private unlockNextChapter(completedChapter: number): void {
    const nextChapter = completedChapter + 1;
    const nextChapterLevels = this.chapterLevels.get(nextChapter);
    
    if (nextChapterLevels && nextChapterLevels.length > 0) {
      const firstLevelOfNextChapter = nextChapterLevels[0];
      
      // Unlock first level of next chapter
      if (!this.levelProgress.has(firstLevelOfNextChapter)) {
        this.levelProgress.set(firstLevelOfNextChapter, {
          levelId: firstLevelOfNextChapter,
          completed: false,
          attempts: 0,
          bestTime: Infinity,
          hintsUsed: 0,
          collectiblesFound: 0,
        });
      }
    }
  }

  /**
   * Get all unlocked levels
   */
  public getUnlockedLevels(): string[] {
    return Array.from(this.levelProgress.keys());
  }

  /**
   * Get levels for level selection interface
   */
  public getLevelSelectionData(): LevelProgress[] {
    return Array.from(this.levelProgress.values());
  }

  /**
   * Get progress for a specific level
   */
  public getLevelProgress(levelId: string): LevelProgress | null {
    return this.levelProgress.get(levelId) || null;
  }

  /**
   * Check if a level is unlocked
   */
  public isLevelUnlocked(levelId: string): boolean {
    return this.levelProgress.has(levelId);
  }

  /**
   * Get the current level ID
   */
  public getCurrentLevel(): string {
    return this.currentLevel;
  }

  /**
   * Set the current level
   */
  public setCurrentLevel(levelId: string): void {
    if (this.levelConfigs.has(levelId)) {
      this.currentLevel = levelId;
      const config = this.levelConfigs.get(levelId)!;
      this.currentChapter = config.chapterNumber;
    }
  }

  /**
   * Get the current chapter number
   */
  public getCurrentChapter(): number {
    return this.currentChapter;
  }

  /**
   * Get all unlocked chapters
   */
  public getUnlockedChapters(): number[] {
    const chapters = new Set<number>();
    
    for (const levelId of this.levelProgress.keys()) {
      const config = this.levelConfigs.get(levelId);
      if (config) {
        chapters.add(config.chapterNumber);
      }
    }
    
    return Array.from(chapters).sort((a, b) => a - b);
  }

  /**
   * Get difficulty multiplier based on current progression
   */
  public getDifficultyMultiplier(): number {
    const completedLevels = Array.from(this.levelProgress.values())
      .filter(p => p.completed).length;
    
    // Increase difficulty by 10% for every 5 completed levels
    return 1 + (Math.floor(completedLevels / 5) * 0.1);
  }

  /**
   * Save progress to a save data object
   */
  public saveProgress(): Record<string, LevelProgress> {
    const progressData: Record<string, LevelProgress> = {};
    
    for (const [levelId, progress] of this.levelProgress.entries()) {
      progressData[levelId] = { ...progress };
    }
    
    return progressData;
  }

  /**
   * Load progress from a save data object
   */
  public loadProgress(saveData: Partial<GameSaveData>): void {
    if (saveData.levelProgress) {
      this.levelProgress.clear();
      
      for (const [levelId, progress] of Object.entries(saveData.levelProgress)) {
        this.levelProgress.set(levelId, { ...progress });
      }
    }
    
    if (saveData.currentLevel) {
      this.currentLevel = saveData.currentLevel;
    }
    
    if (saveData.currentChapter) {
      this.currentChapter = saveData.currentChapter;
    }
  }

  /**
   * Get the first level in the game
   */
  private getFirstLevel(): string | null {
    const chapter1Levels = this.chapterLevels.get(1);
    return chapter1Levels && chapter1Levels.length > 0 ? chapter1Levels[0] : null;
  }

  /**
   * Track level attempt (for statistics)
   */
  public trackLevelAttempt(levelId: string): void {
    let progress = this.levelProgress.get(levelId);
    if (!progress) {
      progress = {
        levelId,
        completed: false,
        attempts: 0,
        bestTime: Infinity,
        hintsUsed: 0,
        collectiblesFound: 0,
      };
      this.levelProgress.set(levelId, progress);
    }
    
    progress.attempts += 1;
  }

  /**
   * Update collectibles found for a level
   */
  public updateCollectiblesFound(levelId: string, count: number): void {
    const progress = this.levelProgress.get(levelId);
    if (progress) {
      progress.collectiblesFound = count;
    }
  }

  /**
   * Get all levels in a chapter
   */
  public getChapterLevels(chapterNumber: number): string[] {
    return this.chapterLevels.get(chapterNumber) || [];
  }

  /**
   * Check if a chapter is unlocked
   */
  public isChapterUnlocked(chapterNumber: number): boolean {
    const chapterLevels = this.chapterLevels.get(chapterNumber);
    if (!chapterLevels || chapterLevels.length === 0) return false;
    
    // Chapter is unlocked if at least one level is unlocked
    return chapterLevels.some(levelId => this.isLevelUnlocked(levelId));
  }
}
