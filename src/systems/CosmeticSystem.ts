import { CosmeticSkin, CosmeticRarity, UnlockConditionType } from '../types/cosmetic';
import { CosmeticData } from '../types/save';

/**
 * CosmeticSystem manages cosmetic skins for the ghost character
 * Handles unlocking, selection, and application of cosmetics
 */
export class CosmeticSystem {
  private availableSkins: Map<string, CosmeticSkin>;
  private unlockedSkins: Set<string>;
  private selectedSkin: string;

  constructor() {
    this.availableSkins = new Map();
    this.unlockedSkins = new Set();
    this.selectedSkin = 'default';
    
    // Initialize with default skin
    this.initializeDefaultSkins();
  }

  /**
   * Initialize default skins
   */
  private initializeDefaultSkins(): void {
    const defaultSkin: CosmeticSkin = {
      id: 'default',
      name: 'Classic Ghost',
      description: 'The original ghostly appearance',
      rarity: CosmeticRarity.COMMON,
      unlockCondition: {
        type: UnlockConditionType.DEFAULT,
        description: 'Available from the start',
      },
      spriteKey: 'ghost_default',
      isUnlocked: true,
    };

    this.availableSkins.set('default', defaultSkin);
    this.unlockedSkins.add('default');
  }

  /**
   * Register a cosmetic skin
   */
  registerSkin(skin: CosmeticSkin): void {
    this.availableSkins.set(skin.id, skin);
  }

  /**
   * Register multiple skins
   */
  registerSkins(skins: CosmeticSkin[]): void {
    for (const skin of skins) {
      this.registerSkin(skin);
    }
  }

  /**
   * Unlock a cosmetic skin
   */
  unlockSkin(skinId: string): boolean {
    const skin = this.availableSkins.get(skinId);
    
    if (!skin) {
      console.warn(`Skin ${skinId} not found`);
      return false;
    }

    if (this.unlockedSkins.has(skinId)) {
      console.log(`Skin ${skinId} already unlocked`);
      return false;
    }

    this.unlockedSkins.add(skinId);
    skin.isUnlocked = true;
    
    console.log(`Unlocked skin: ${skin.name}`);
    return true;
  }

  /**
   * Select a cosmetic skin
   */
  selectSkin(skinId: string): boolean {
    if (!this.unlockedSkins.has(skinId)) {
      console.warn(`Cannot select locked skin: ${skinId}`);
      return false;
    }

    const skin = this.availableSkins.get(skinId);
    if (!skin) {
      console.warn(`Skin ${skinId} not found`);
      return false;
    }

    this.selectedSkin = skinId;
    console.log(`Selected skin: ${skin.name}`);
    return true;
  }

  /**
   * Get the currently selected skin
   */
  getSelectedSkin(): CosmeticSkin | null {
    return this.availableSkins.get(this.selectedSkin) || null;
  }

  /**
   * Get the selected skin ID
   */
  getSelectedSkinId(): string {
    return this.selectedSkin;
  }

  /**
   * Get all available skins
   */
  getAllSkins(): CosmeticSkin[] {
    return Array.from(this.availableSkins.values());
  }

  /**
   * Get all unlocked skins
   */
  getUnlockedSkins(): CosmeticSkin[] {
    return Array.from(this.availableSkins.values())
      .filter(skin => this.unlockedSkins.has(skin.id));
  }

  /**
   * Get all locked skins
   */
  getLockedSkins(): CosmeticSkin[] {
    return Array.from(this.availableSkins.values())
      .filter(skin => !this.unlockedSkins.has(skin.id));
  }

  /**
   * Check if a skin is unlocked
   */
  isSkinUnlocked(skinId: string): boolean {
    return this.unlockedSkins.has(skinId);
  }

  /**
   * Get skin by ID
   */
  getSkin(skinId: string): CosmeticSkin | null {
    return this.availableSkins.get(skinId) || null;
  }

  /**
   * Get skins by rarity
   */
  getSkinsByRarity(rarity: CosmeticRarity): CosmeticSkin[] {
    return Array.from(this.availableSkins.values())
      .filter(skin => skin.rarity === rarity);
  }

  /**
   * Get the sprite key for the currently selected skin
   */
  getSelectedSpriteKey(): string {
    const skin = this.getSelectedSkin();
    return skin ? skin.spriteKey : 'ghost_default';
  }

  /**
   * Check if a skin can be unlocked based on condition
   */
  canUnlockSkin(skinId: string, context: UnlockContext): boolean {
    const skin = this.availableSkins.get(skinId);
    
    if (!skin) {
      return false;
    }

    if (this.unlockedSkins.has(skinId)) {
      return false; // Already unlocked
    }

    const condition = skin.unlockCondition;

    switch (condition.type) {
      case UnlockConditionType.DEFAULT:
        return true;

      case UnlockConditionType.LEVEL_COMPLETE:
        return context.completedLevels?.includes(condition.requirement as string) || false;

      case UnlockConditionType.CHAPTER_COMPLETE:
        return context.completedChapters?.includes(condition.requirement as number) || false;

      case UnlockConditionType.COLLECTIBLE_COUNT:
        return (context.collectibleCount || 0) >= (condition.requirement as number);

      case UnlockConditionType.PURCHASE:
        return context.hasPurchased || false;

      case UnlockConditionType.ACHIEVEMENT:
        return context.achievements?.includes(condition.requirement as string) || false;

      default:
        return false;
    }
  }

  /**
   * Auto-unlock skins based on context
   */
  autoUnlockSkins(context: UnlockContext): string[] {
    const newlyUnlocked: string[] = [];

    for (const [skinId, skin] of this.availableSkins.entries()) {
      if (!this.unlockedSkins.has(skinId) && this.canUnlockSkin(skinId, context)) {
        if (this.unlockSkin(skinId)) {
          newlyUnlocked.push(skinId);
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Save cosmetic data
   */
  saveCosmeticData(): CosmeticData {
    return {
      unlockedSkins: Array.from(this.unlockedSkins),
      selectedSkin: this.selectedSkin,
    };
  }

  /**
   * Load cosmetic data
   */
  loadCosmeticData(data: CosmeticData): void {
    this.unlockedSkins.clear();
    
    for (const skinId of data.unlockedSkins) {
      this.unlockedSkins.add(skinId);
      const skin = this.availableSkins.get(skinId);
      if (skin) {
        skin.isUnlocked = true;
      }
    }

    // Validate selected skin is unlocked
    if (this.unlockedSkins.has(data.selectedSkin)) {
      this.selectedSkin = data.selectedSkin;
    } else {
      this.selectedSkin = 'default';
    }
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.unlockedSkins.clear();
    this.unlockedSkins.add('default');
    this.selectedSkin = 'default';

    // Reset all skins to locked except default
    for (const skin of this.availableSkins.values()) {
      skin.isUnlocked = skin.id === 'default';
    }
  }

  /**
   * Get unlock progress (percentage of skins unlocked)
   */
  getUnlockProgress(): number {
    const total = this.availableSkins.size;
    const unlocked = this.unlockedSkins.size;
    return total > 0 ? (unlocked / total) * 100 : 0;
  }
}

/**
 * Context for checking unlock conditions
 */
export interface UnlockContext {
  completedLevels?: string[];
  completedChapters?: number[];
  collectibleCount?: number;
  hasPurchased?: boolean;
  achievements?: string[];
}
