/**
 * LocalStorageManager - Handles saving and loading game data to browser localStorage
 */
export class LocalStorageManager {
  private static readonly STORAGE_KEY = 'chain_ledge_game_data';
  private static readonly VERSION = '1.0.0';

  /**
   * Save game data to localStorage
   */
  public static saveToLocalStorage(registry: Phaser.Data.DataManager): void {
    try {
      const gameData = {
        version: this.VERSION,
        timestamp: Date.now(),
        playerCurrency: registry.get('playerCurrency') || 150,
        adWatchCount: registry.get('adWatchCount') || 0,
        ownedShopItems: registry.get('ownedShopItems') || [],
        unlockedCosmetics: registry.get('unlockedCosmetics') || ['default_ghost'],
        equippedCosmetics: registry.get('equippedCosmetics') || {
          skin: 'default_ghost',
          trail: 'sparkle_trail',
          effect: 'glow_effect'
        },
        abilityCharges: registry.get('abilityCharges') || {
          PHASE: 3,
          POSSESS: 3,
          SENSE: 3,
          SPEED_BOOST: 3
        },
        maxHealth: registry.get('maxHealth') || 3,
        unlockedChapters: registry.get('unlockedChapters') || [1],
        levelProgress: registry.get('levelProgress') || {},
        highScores: registry.get('highScores') || {}
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(gameData));
      console.log('✅ Game data saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }
  }

  /**
   * Load game data from localStorage
   */
  public static loadFromLocalStorage(registry: Phaser.Data.DataManager): boolean {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      
      if (!savedData) {
        console.log('No saved data found, using defaults');
        this.setDefaults(registry);
        return false;
      }

      const gameData = JSON.parse(savedData);

      // Validate version
      if (gameData.version !== this.VERSION) {
        console.warn('Save data version mismatch, using defaults');
        this.setDefaults(registry);
        return false;
      }

      // Load all data into registry
      registry.set('playerCurrency', gameData.playerCurrency);
      registry.set('adWatchCount', gameData.adWatchCount);
      registry.set('ownedShopItems', gameData.ownedShopItems);
      registry.set('unlockedCosmetics', gameData.unlockedCosmetics);
      registry.set('equippedCosmetics', gameData.equippedCosmetics);
      registry.set('abilityCharges', gameData.abilityCharges);
      registry.set('maxHealth', gameData.maxHealth);
      registry.set('unlockedChapters', gameData.unlockedChapters);
      registry.set('levelProgress', gameData.levelProgress);
      registry.set('highScores', gameData.highScores);

      console.log('✅ Game data loaded from localStorage');
      return true;
    } catch (error) {
      console.error('❌ Failed to load from localStorage:', error);
      this.setDefaults(registry);
      return false;
    }
  }

  /**
   * Set default values
   */
  private static setDefaults(registry: Phaser.Data.DataManager): void {
    registry.set('playerCurrency', 150);
    registry.set('adWatchCount', 0);
    registry.set('ownedShopItems', []);
    registry.set('unlockedCosmetics', ['default_ghost']);
    registry.set('equippedCosmetics', {
      skin: 'default_ghost',
      trail: 'sparkle_trail',
      effect: 'glow_effect'
    });
    registry.set('abilityCharges', {
      PHASE: 3,
      POSSESS: 3,
      SENSE: 3,
      SPEED_BOOST: 3
    });
    registry.set('maxHealth', 3);
    registry.set('unlockedChapters', [1]);
    registry.set('levelProgress', {});
    registry.set('highScores', {});
  }

  /**
   * Clear all saved data
   */
  public static clearSaveData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Save data cleared');
    } catch (error) {
      console.error('❌ Failed to clear save data:', error);
    }
  }

  /**
   * Check if save data exists
   */
  public static hasSaveData(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Get save data info
   */
  public static getSaveInfo(): { exists: boolean; timestamp?: number; version?: string } {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (!savedData) {
        return { exists: false };
      }

      const gameData = JSON.parse(savedData);
      return {
        exists: true,
        timestamp: gameData.timestamp,
        version: gameData.version
      };
    } catch (error) {
      return { exists: false };
    }
  }
}
