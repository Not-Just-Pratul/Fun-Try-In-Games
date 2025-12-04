/**
 * Monetization Service
 * Manages in-app purchases and reward-based ads
 */

export enum PurchaseType {
  COSMETIC = 'cosmetic',
  ABILITY_BUNDLE = 'ability_bundle',
  CHAPTER_UNLOCK = 'chapter_unlock',
  HINT_PACK = 'hint_pack'
}

export enum AdRewardType {
  HINT_CHARGE = 'hint_charge',
  ABILITY_CHARGE = 'ability_charge'
}

export interface ShopItem {
  id: string;
  type: PurchaseType;
  name: string;
  description: string;
  price: number;
  currency: string;
  itemData: any; // Specific data based on type
  available: boolean;
}

export interface PurchaseResult {
  success: boolean;
  itemId: string;
  error?: string;
}

export interface AdRewardResult {
  success: boolean;
  rewardType: AdRewardType;
  amount: number;
  error?: string;
}

export interface PurchaseRecord {
  itemId: string;
  timestamp: number;
  type: PurchaseType;
}

export class MonetizationService {
  private purchasedItems: Set<string> = new Set();
  private purchaseHistory: PurchaseRecord[] = [];
  private adProvider: AdProvider | null = null;

  constructor(adProvider?: AdProvider) {
    this.adProvider = adProvider || null;
  }

  /**
   * Get all available shop items
   */
  getShopInventory(): ShopItem[] {
    const inventory: ShopItem[] = [
      // Cosmetics
      {
        id: 'cosmetic_ethereal_glow',
        type: PurchaseType.COSMETIC,
        name: 'Ethereal Glow',
        description: 'A shimmering aura surrounds your ghost',
        price: 2.99,
        currency: 'USD',
        itemData: { cosmeticId: 'ethereal_glow' },
        available: !this.isPurchased('cosmetic_ethereal_glow')
      },
      {
        id: 'cosmetic_shadow_form',
        type: PurchaseType.COSMETIC,
        name: 'Shadow Form',
        description: 'Become one with the darkness',
        price: 2.99,
        currency: 'USD',
        itemData: { cosmeticId: 'shadow_form' },
        available: !this.isPurchased('cosmetic_shadow_form')
      },
      // Ability bundles
      {
        id: 'ability_starter_pack',
        type: PurchaseType.ABILITY_BUNDLE,
        name: 'Starter Ability Pack',
        description: '10 charges for each ability',
        price: 4.99,
        currency: 'USD',
        itemData: { charges: 10 },
        available: true
      },
      // Chapter unlocks
      {
        id: 'chapter_2_unlock',
        type: PurchaseType.CHAPTER_UNLOCK,
        name: 'Chapter 2: The Forgotten Halls',
        description: 'Unlock the second chapter early',
        price: 3.99,
        currency: 'USD',
        itemData: { chapterId: 2 },
        available: !this.isPurchased('chapter_2_unlock')
      },
      // Hint packs
      {
        id: 'hint_pack_small',
        type: PurchaseType.HINT_PACK,
        name: 'Small Hint Pack',
        description: '5 additional hints',
        price: 0.99,
        currency: 'USD',
        itemData: { hints: 5 },
        available: true
      }
    ];

    return inventory;
  }

  /**
   * Check if an item has been purchased
   */
  isPurchased(itemId: string): boolean {
    return this.purchasedItems.has(itemId);
  }

  /**
   * Process a purchase
   */
  async purchase(itemId: string): Promise<PurchaseResult> {
    const item = this.getShopInventory().find(i => i.id === itemId);
    
    if (!item) {
      return {
        success: false,
        itemId,
        error: 'Item not found'
      };
    }

    if (!item.available) {
      return {
        success: false,
        itemId,
        error: 'Item not available'
      };
    }

    // Simulate purchase verification
    // In production, this would integrate with platform-specific purchase APIs
    try {
      await this.verifyPurchase(itemId);
      
      // Record purchase
      this.purchasedItems.add(itemId);
      this.purchaseHistory.push({
        itemId,
        timestamp: Date.now(),
        type: item.type
      });

      return {
        success: true,
        itemId
      };
    } catch (error) {
      return {
        success: false,
        itemId,
        error: error instanceof Error ? error.message : 'Purchase failed'
      };
    }
  }

  /**
   * Verify purchase with platform
   */
  private async verifyPurchase(itemId: string): Promise<void> {
    // Simulate async verification
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // In production, verify with App Store/Play Store
        resolve();
      }, 100);
    });
  }

  /**
   * Show reward-based ad
   */
  async showRewardAd(rewardType: AdRewardType): Promise<AdRewardResult> {
    if (!this.adProvider) {
      return {
        success: false,
        rewardType,
        amount: 0,
        error: 'Ad provider not configured'
      };
    }

    try {
      const adReady = await this.adProvider.isAdReady();
      
      if (!adReady) {
        return {
          success: false,
          rewardType,
          amount: 0,
          error: 'Ad not ready'
        };
      }

      const watched = await this.adProvider.showAd();
      
      if (!watched) {
        return {
          success: false,
          rewardType,
          amount: 0,
          error: 'Ad not completed'
        };
      }

      // Grant reward
      const amount = this.getRewardAmount(rewardType);
      
      return {
        success: true,
        rewardType,
        amount
      };
    } catch (error) {
      return {
        success: false,
        rewardType,
        amount: 0,
        error: error instanceof Error ? error.message : 'Ad failed'
      };
    }
  }

  /**
   * Get reward amount for ad type
   */
  private getRewardAmount(rewardType: AdRewardType): number {
    switch (rewardType) {
      case AdRewardType.HINT_CHARGE:
        return 1;
      case AdRewardType.ABILITY_CHARGE:
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Get purchase history
   */
  getPurchaseHistory(): PurchaseRecord[] {
    return [...this.purchaseHistory];
  }

  /**
   * Check if core content is accessible without purchases
   */
  isCoreContentAccessible(): boolean {
    // Core content includes:
    // - Chapter 1 (all levels)
    // - Basic abilities (earned through gameplay)
    // - Default cosmetics
    // - Hint system (with cooldown)
    return true; // Core content is always accessible
  }

  /**
   * Restore purchases (for platform account changes)
   */
  async restorePurchases(): Promise<string[]> {
    // In production, query platform for previous purchases
    return Array.from(this.purchasedItems);
  }

  /**
   * Load purchase data from save
   */
  loadPurchaseData(data: { purchased: string[], history: PurchaseRecord[] }): void {
    this.purchasedItems = new Set(data.purchased);
    this.purchaseHistory = data.history;
  }

  /**
   * Get purchase data for save
   */
  getPurchaseData(): { purchased: string[], history: PurchaseRecord[] } {
    return {
      purchased: Array.from(this.purchasedItems),
      history: this.purchaseHistory
    };
  }
}

/**
 * Ad Provider Interface
 * Platform-specific implementations should implement this
 */
export interface AdProvider {
  isAdReady(): Promise<boolean>;
  showAd(): Promise<boolean>;
  loadAd(): Promise<void>;
}

/**
 * Mock Ad Provider for testing
 */
export class MockAdProvider implements AdProvider {
  private adReady: boolean = true;
  private shouldComplete: boolean = true;

  async isAdReady(): Promise<boolean> {
    return this.adReady;
  }

  async showAd(): Promise<boolean> {
    return this.shouldComplete;
  }

  async loadAd(): Promise<void> {
    this.adReady = true;
  }

  setAdReady(ready: boolean): void {
    this.adReady = ready;
  }

  setShouldComplete(complete: boolean): void {
    this.shouldComplete = complete;
  }
}
