import { GameSaveData } from '@game-types/save';
import { ErrorHandler, ErrorType } from './ErrorHandler';

/**
 * SaveDataValidator - Validates and repairs save data
 */
export class SaveDataValidator {
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly REQUIRED_FIELDS = [
    'version',
    'timestamp',
    'levelProgress',
    'currentLevel',
    'currentChapter'
  ];

  /**
   * Validates save data structure and integrity
   */
  public static validate(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if data exists
    if (!data) {
      errors.push('Save data is null or undefined');
      return { isValid: false, errors, warnings };
    }

    // Check if data is an object
    if (typeof data !== 'object') {
      errors.push('Save data is not an object');
      return { isValid: false, errors, warnings };
    }

    // Check required fields
    for (const field of this.REQUIRED_FIELDS) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate version
    if (data.version && typeof data.version !== 'string') {
      errors.push('Version must be a string');
    }

    // Validate timestamp
    if (data.timestamp) {
      if (typeof data.timestamp !== 'number') {
        errors.push('Timestamp must be a number');
      } else if (data.timestamp <= 0) {
        errors.push('Timestamp must be positive');
      } else if (data.timestamp > Date.now()) {
        warnings.push('Timestamp is in the future');
      }
    }

    // Validate level progress
    if (data.levelProgress && typeof data.levelProgress !== 'object') {
      errors.push('Level progress must be an object');
    }

    // Validate unlocked memories
    if (data.unlockedMemories && !Array.isArray(data.unlockedMemories)) {
      errors.push('Unlocked memories must be an array');
    }

    // Check version compatibility
    if (data.version && data.version !== this.CURRENT_VERSION) {
      warnings.push(`Save data version mismatch: ${data.version} vs ${this.CURRENT_VERSION}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Attempts to repair corrupted save data
   */
  public static repair(data: any): GameSaveData | null {
    try {
      const repaired: any = { ...data };

      // Set default version
      if (!repaired.version) {
        repaired.version = this.CURRENT_VERSION;
      }

      // Set default timestamp
      if (!repaired.timestamp || typeof repaired.timestamp !== 'number') {
        repaired.timestamp = Date.now();
      }

      // Initialize level progress
      if (!repaired.levelProgress || typeof repaired.levelProgress !== 'object') {
        repaired.levelProgress = {};
      }

      // Set default current level
      if (!repaired.currentLevel) {
        repaired.currentLevel = 'tutorial';
      }

      // Set default current chapter
      if (!repaired.currentChapter) {
        repaired.currentChapter = 1;
      }

      // Initialize unlocked memories
      if (!Array.isArray(repaired.unlockedMemories)) {
        repaired.unlockedMemories = [];
      }

      // Initialize lore collection
      if (!Array.isArray(repaired.loreCollection)) {
        repaired.loreCollection = [];
      }

      // Initialize inventory
      if (!repaired.inventory || typeof repaired.inventory !== 'object') {
        repaired.inventory = {
          clues: [],
          loreItems: [],
          cosmetics: [],
          abilityCharges: {}
        };
      }

      // Initialize cosmetics
      if (!repaired.cosmetics || typeof repaired.cosmetics !== 'object') {
        repaired.cosmetics = {
          unlockedSkins: [],
          selectedSkin: 'default'
        };
      }

      // Initialize settings
      if (!repaired.settings || typeof repaired.settings !== 'object') {
        repaired.settings = {
          musicVolume: 0.7,
          sfxVolume: 0.8,
          voiceVolume: 0.9,
          language: 'en',
          highContrastMode: false,
          colorblindMode: false,
          uiScale: 1.0
        };
      }

      // Validate repaired data
      const validation = this.validate(repaired);
      if (!validation.isValid) {
        ErrorHandler.logError(
          ErrorType.VALIDATION,
          'Failed to repair save data',
          { errors: validation.errors }
        );
        return null;
      }

      ErrorHandler.logError(
        ErrorType.VALIDATION,
        'Save data repaired successfully',
        { warnings: validation.warnings }
      );

      return repaired as GameSaveData;
    } catch (error) {
      ErrorHandler.handleError(error as Error, { action: 'repair_save_data' });
      return null;
    }
  }

  /**
   * Creates default save data
   */
  public static createDefault(): GameSaveData {
    return {
      version: this.CURRENT_VERSION,
      timestamp: Date.now(),
      levelProgress: {},
      currentLevel: 'tutorial',
      currentChapter: 1,
      unlockedMemories: [],
      loreCollection: [],
      inventory: {
        clues: [],
        loreItems: [],
        cosmetics: [],
        abilityCharges: {}
      },
      cosmetics: {
        unlockedSkins: [],
        selectedSkin: 'default'
      },
      settings: {
        musicVolume: 0.7,
        sfxVolume: 0.8,
        voiceVolume: 0.9,
        language: 'en',
        highContrastMode: false,
        colorblindMode: false,
        uiScale: 1.0
      }
    };
  }

  /**
   * Migrates save data to current version
   */
  public static migrate(data: any, fromVersion: string): GameSaveData | null {
    try {
      // Add migration logic for different versions
      let migrated = { ...data };

      // Example: Migrate from 0.9.0 to 1.0.0
      if (fromVersion === '0.9.0') {
        // Add new fields, transform old data, etc.
        migrated.version = this.CURRENT_VERSION;
      }

      return migrated as GameSaveData;
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        action: 'migrate_save_data',
        fromVersion
      });
      return null;
    }
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
