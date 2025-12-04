import { PersistenceService } from './PersistenceService';
import { GameSaveData } from '../types/save';

/**
 * Configuration for the save manager
 */
export interface SaveManagerConfig {
  autoSaveIntervalMs: number;
  maxRetries: number;
  retryDelayMs: number;
  saveKey: string;
}

/**
 * GameSaveManager handles game state persistence with auto-save and retry logic
 */
export class GameSaveManager {
  private persistenceService: PersistenceService;
  private config: SaveManagerConfig;
  private autoSaveTimer: number | null = null;
  private lastSaveTime: number = 0;
  private saveInProgress: boolean = false;

  constructor(
    persistenceService: PersistenceService,
    config: Partial<SaveManagerConfig> = {}
  ) {
    this.persistenceService = persistenceService;
    this.config = {
      autoSaveIntervalMs: config.autoSaveIntervalMs || 120000, // 2 minutes default
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 1000,
      saveKey: config.saveKey || 'game_save',
    };
  }

  /**
   * Save game data with retry logic
   */
  async saveGame(data: GameSaveData): Promise<boolean> {
    if (this.saveInProgress) {
      console.warn('Save already in progress, skipping');
      return false;
    }

    this.saveInProgress = true;

    try {
      // Validate save data
      if (!this.validateSaveData(data)) {
        throw new Error('Invalid save data');
      }

      // Add timestamp
      const saveData: GameSaveData = {
        ...data,
        timestamp: Date.now(),
      };

      // Attempt save with exponential backoff retry
      const success = await this.saveWithRetry(saveData);

      if (success) {
        this.lastSaveTime = Date.now();
      }

      return success;
    } catch (error) {
      console.error('Save game error:', error);
      return false;
    } finally {
      this.saveInProgress = false;
    }
  }

  /**
   * Save with exponential backoff retry logic
   */
  private async saveWithRetry(data: GameSaveData): Promise<boolean> {
    let attempt = 0;
    let delay = this.config.retryDelayMs;

    while (attempt < this.config.maxRetries) {
      try {
        const success = await this.persistenceService.save(this.config.saveKey, data);
        
        if (success) {
          return true;
        }

        // If save failed, wait before retry
        attempt++;
        if (attempt < this.config.maxRetries) {
          console.warn(`Save attempt ${attempt} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
          delay *= 2; // Exponential backoff
        }
      } catch (error) {
        console.error(`Save attempt ${attempt + 1} error:`, error);
        attempt++;
        
        if (attempt < this.config.maxRetries) {
          await this.sleep(delay);
          delay *= 2;
        }
      }
    }

    return false;
  }

  /**
   * Load game data
   */
  async loadGame(): Promise<GameSaveData | null> {
    try {
      const data = await this.persistenceService.load(this.config.saveKey);
      
      if (!data) {
        console.log('No save data found');
        return null;
      }

      // Validate loaded data
      if (!this.validateSaveData(data)) {
        console.error('Loaded save data is invalid');
        return null;
      }

      console.log('Game loaded successfully');
      return data as GameSaveData;
    } catch (error) {
      console.error('Load game error:', error);
      return null;
    }
  }

  /**
   * Delete save data
   */
  async deleteSave(): Promise<boolean> {
    try {
      return await this.persistenceService.delete(this.config.saveKey);
    } catch (error) {
      console.error('Delete save error:', error);
      return false;
    }
  }

  /**
   * Check if save data exists
   */
  async hasSaveData(): Promise<boolean> {
    try {
      return await this.persistenceService.exists(this.config.saveKey);
    } catch (error) {
      console.error('Check save exists error:', error);
      return false;
    }
  }

  /**
   * Start auto-save system
   */
  startAutoSave(getSaveData: () => GameSaveData): void {
    this.stopAutoSave();

    // Use global setInterval (works in both browser and Node.js)
    const setIntervalFn = typeof window !== 'undefined' ? window.setInterval : setInterval;
    this.autoSaveTimer = setIntervalFn(() => {
      const data = getSaveData();
      this.saveGame(data).catch(error => {
        console.error('Auto-save failed:', error);
      });
    }, this.config.autoSaveIntervalMs) as any;
  }

  /**
   * Stop auto-save system
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Save on exit (call this when app is backgrounded or closed)
   */
  async saveOnExit(data: GameSaveData): Promise<boolean> {
    console.log('Saving on exit...');
    this.stopAutoSave();
    return await this.saveGame(data);
  }

  /**
   * Validate save data integrity
   */
  private validateSaveData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required fields
    const required = [
      'version',
      'timestamp',
      'levelProgress',
      'currentLevel',
      'currentChapter',
      'unlockedMemories',
      'loreCollection',
      'inventory',
      'cosmetics',
      'settings',
    ];

    for (const field of required) {
      if (!(field in data)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate types
    if (typeof data.version !== 'string') return false;
    if (typeof data.timestamp !== 'number') return false;
    if (typeof data.levelProgress !== 'object') return false;
    if (typeof data.currentLevel !== 'string') return false;
    if (typeof data.currentChapter !== 'number') return false;
    if (!Array.isArray(data.unlockedMemories)) return false;
    if (!Array.isArray(data.loreCollection)) return false;
    if (typeof data.inventory !== 'object') return false;
    if (typeof data.cosmetics !== 'object') return false;
    if (typeof data.settings !== 'object') return false;

    return true;
  }

  /**
   * Get time since last save
   */
  getTimeSinceLastSave(): number {
    if (this.lastSaveTime === 0) {
      return Infinity;
    }
    return Date.now() - this.lastSaveTime;
  }

  /**
   * Check if auto-save is active
   */
  isAutoSaveActive(): boolean {
    return this.autoSaveTimer !== null;
  }

  /**
   * Helper to sleep for a duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a default save data structure
   */
  static createDefaultSaveData(): GameSaveData {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      levelProgress: {},
      currentLevel: '',
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
        musicVolume: 0.7,
        sfxVolume: 0.8,
        voiceVolume: 0.9,
        language: 'en',
        highContrastMode: false,
        colorblindMode: false,
        uiScale: 1.0,
      },
    };
  }
}
