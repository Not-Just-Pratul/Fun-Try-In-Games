import Phaser from 'phaser';

/**
 * AssetLoader - Manages asset preloading and caching
 */
export class AssetLoader {
  private scene: Phaser.Scene;
  private loadedAssets: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Preloads essential assets
   */
  public async preloadEssential(): Promise<void> {
    const essentialAssets = [
      // Add essential asset keys here
      'particle',
      'glow',
      'sparkle'
    ];

    await Promise.all(
      essentialAssets.map(key => this.loadAsset(key))
    );
  }

  /**
   * Preloads level-specific assets
   */
  public async preloadLevel(levelId: string): Promise<void> {
    // Load level-specific assets based on level type
    const assets = this.getLevelAssets(levelId);
    
    await Promise.all(
      assets.map(key => this.loadAsset(key))
    );
  }

  /**
   * Loads a single asset
   */
  private async loadAsset(key: string): Promise<void> {
    // Check if already loaded
    if (this.loadedAssets.has(key)) {
      return;
    }

    // Check if currently loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    // Start loading
    const promise = new Promise<void>((resolve) => {
      // In a real implementation, this would load actual assets
      // For now, just mark as loaded
      this.loadedAssets.add(key);
      resolve();
    });

    this.loadingPromises.set(key, promise);
    await promise;
    this.loadingPromises.delete(key);
  }

  /**
   * Gets assets needed for a level
   */
  private getLevelAssets(levelId: string): string[] {
    // Return level-specific asset keys
    return [
      'maze-tiles',
      'ghost-sprite',
      'collectible-sprites',
      'obstacle-sprites'
    ];
  }

  /**
   * Unloads assets to free memory
   */
  public unloadLevel(levelId: string): void {
    const assets = this.getLevelAssets(levelId);
    
    assets.forEach(key => {
      if (this.loadedAssets.has(key)) {
        // In a real implementation, unload the asset
        this.loadedAssets.delete(key);
      }
    });
  }

  /**
   * Checks if an asset is loaded
   */
  public isLoaded(key: string): boolean {
    return this.loadedAssets.has(key);
  }

  /**
   * Gets cache statistics
   */
  public getCacheStats(): CacheStats {
    return {
      loadedAssets: this.loadedAssets.size,
      loadingAssets: this.loadingPromises.size,
      totalMemory: 0 // Would calculate actual memory usage
    };
  }
}

/**
 * Cache statistics
 */
export interface CacheStats {
  loadedAssets: number;
  loadingAssets: number;
  totalMemory: number;
}
