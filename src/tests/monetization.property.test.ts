/**
 * Property-based tests for monetization system
 */

import fc from 'fast-check';
import {
  MonetizationService,
  PurchaseType,
  AdRewardType,
  MockAdProvider,
  ShopItem
} from '../systems/MonetizationService';

describe('Monetization System Properties', () => {
  /**
   * Property 38: Shop inventory accuracy
   * All items in shop inventory must have valid data and correct availability
   */
  describe('Property 38: Shop inventory accuracy', () => {
    it('should return valid shop items with correct structure', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Has ad provider
          (hasAdProvider) => {
            const adProvider = hasAdProvider ? new MockAdProvider() : undefined;
            const service = new MonetizationService(adProvider);
            
            const inventory = service.getShopInventory();
            
            // All items must have required fields
            for (const item of inventory) {
              expect(item.id).toBeDefined();
              expect(item.type).toBeDefined();
              expect(item.name).toBeDefined();
              expect(item.description).toBeDefined();
              expect(item.price).toBeGreaterThan(0);
              expect(item.currency).toBeDefined();
              expect(item.itemData).toBeDefined();
              expect(typeof item.available).toBe('boolean');
            }
            
            // All item IDs must be unique
            const ids = inventory.map(i => i.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark purchased items as unavailable for one-time purchases', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom('cosmetic_ethereal_glow', 'cosmetic_shadow_form', 'chapter_2_unlock'),
          async (itemId) => {
            const service = new MonetizationService();
            
            // Item should be available initially
            const inventoryBefore = service.getShopInventory();
            const itemBefore = inventoryBefore.find(i => i.id === itemId);
            expect(itemBefore?.available).toBe(true);
            
            // Purchase item
            await service.purchase(itemId);
            
            // Item should be unavailable after purchase
            const inventoryAfter = service.getShopInventory();
            const itemAfter = inventoryAfter.find(i => i.id === itemId);
            expect(itemAfter?.available).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should keep consumable items available after purchase', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom('ability_starter_pack', 'hint_pack_small'),
          async (itemId) => {
            const service = new MonetizationService();
            
            // Purchase item
            await service.purchase(itemId);
            
            // Consumable items should remain available
            const inventory = service.getShopInventory();
            const item = inventory.find(i => i.id === itemId);
            expect(item?.available).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 39: Purchase fulfillment
   * Successful purchases must be recorded and persisted
   */
  describe('Property 39: Purchase fulfillment', () => {
    it('should record successful purchases', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(
              'cosmetic_ethereal_glow',
              'ability_starter_pack',
              'chapter_2_unlock',
              'hint_pack_small'
            ),
            { minLength: 1, maxLength: 5 }
          ),
          async (itemIds) => {
            const service = new MonetizationService();
            const uniqueItems = [...new Set(itemIds)];
            
            // Purchase all items
            for (const itemId of uniqueItems) {
              const result = await service.purchase(itemId);
              expect(result.success).toBe(true);
              expect(result.itemId).toBe(itemId);
            }
            
            // All purchases should be recorded
            const history = service.getPurchaseHistory();
            expect(history.length).toBeGreaterThanOrEqual(uniqueItems.length);
            
            // Each purchase should have valid data
            for (const record of history) {
              expect(record.itemId).toBeDefined();
              expect(record.timestamp).toBeGreaterThan(0);
              expect(record.type).toBeDefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should persist purchase data across save/load', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(
              'cosmetic_ethereal_glow',
              'cosmetic_shadow_form',
              'chapter_2_unlock'
            ),
            { minLength: 1, maxLength: 3 }
          ),
          async (itemIds) => {
            const service1 = new MonetizationService();
            
            // Purchase items
            for (const itemId of itemIds) {
              await service1.purchase(itemId);
            }
            
            // Save purchase data
            const saveData = service1.getPurchaseData();
            
            // Load into new service
            const service2 = new MonetizationService();
            service2.loadPurchaseData(saveData);
            
            // All purchases should be restored
            for (const itemId of itemIds) {
              expect(service2.isPurchased(itemId)).toBe(true);
            }
            
            // History should match
            const history1 = service1.getPurchaseHistory();
            const history2 = service2.getPurchaseHistory();
            expect(history2.length).toBe(history1.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject invalid purchase attempts', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string(),
          async (invalidItemId) => {
            const service = new MonetizationService();
            const validIds = service.getShopInventory().map(i => i.id);
            
            // Skip if randomly generated ID happens to be valid
            if (validIds.includes(invalidItemId)) {
              return;
            }
            
            const result = await service.purchase(invalidItemId);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 40: Core content accessibility
   * Core game content must always be accessible without purchases
   */
  describe('Property 40: Core content accessibility', () => {
    it('should always report core content as accessible', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(
              'cosmetic_ethereal_glow',
              'ability_starter_pack',
              'chapter_2_unlock',
              'hint_pack_small'
            ),
            { maxLength: 10 }
          ),
          async (purchaseSequence) => {
            const service = new MonetizationService();
            
            // Core content should be accessible before any purchases
            expect(service.isCoreContentAccessible()).toBe(true);
            
            // Make purchases
            for (const itemId of purchaseSequence) {
              await service.purchase(itemId);
            }
            
            // Core content should still be accessible after purchases
            expect(service.isCoreContentAccessible()).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 10000);

    it('should not require purchases for Chapter 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (hasPurchases) => {
            const service = new MonetizationService();
            
            if (hasPurchases) {
              // Even with chapter unlock purchases, Chapter 1 is free
              await service.purchase('chapter_2_unlock');
            }
            
            // Chapter 1 should always be accessible
            expect(service.isCoreContentAccessible()).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 10000);
  });

  /**
   * Property 41: Ad reward fulfillment
   * Watching ads must grant the promised rewards
   */
  describe('Property 41: Ad reward fulfillment', () => {
    it('should grant rewards when ad is completed', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(AdRewardType.HINT_CHARGE, AdRewardType.ABILITY_CHARGE),
          async (rewardType) => {
            const adProvider = new MockAdProvider();
            adProvider.setAdReady(true);
            adProvider.setShouldComplete(true);
            
            const service = new MonetizationService(adProvider);
            
            const result = await service.showRewardAd(rewardType);
            
            expect(result.success).toBe(true);
            expect(result.rewardType).toBe(rewardType);
            expect(result.amount).toBeGreaterThan(0);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not grant rewards when ad is not completed', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(AdRewardType.HINT_CHARGE, AdRewardType.ABILITY_CHARGE),
          async (rewardType) => {
            const adProvider = new MockAdProvider();
            adProvider.setAdReady(true);
            adProvider.setShouldComplete(false); // User closes ad early
            
            const service = new MonetizationService(adProvider);
            
            const result = await service.showRewardAd(rewardType);
            
            expect(result.success).toBe(false);
            expect(result.amount).toBe(0);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should fail gracefully when ad is not ready', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(AdRewardType.HINT_CHARGE, AdRewardType.ABILITY_CHARGE),
          async (rewardType) => {
            const adProvider = new MockAdProvider();
            adProvider.setAdReady(false);
            
            const service = new MonetizationService(adProvider);
            
            const result = await service.showRewardAd(rewardType);
            
            expect(result.success).toBe(false);
            expect(result.amount).toBe(0);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should fail gracefully when no ad provider is configured', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(AdRewardType.HINT_CHARGE, AdRewardType.ABILITY_CHARGE),
          async (rewardType) => {
            const service = new MonetizationService(); // No ad provider
            
            const result = await service.showRewardAd(rewardType);
            
            expect(result.success).toBe(false);
            expect(result.amount).toBe(0);
            expect(result.error).toBe('Ad provider not configured');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should grant consistent reward amounts', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(AdRewardType.HINT_CHARGE, AdRewardType.ABILITY_CHARGE),
          fc.integer({ min: 1, max: 5 }),
          async (rewardType, watchCount) => {
            const adProvider = new MockAdProvider();
            adProvider.setAdReady(true);
            adProvider.setShouldComplete(true);
            
            const service = new MonetizationService(adProvider);
            
            const amounts: number[] = [];
            
            for (let i = 0; i < watchCount; i++) {
              const result = await service.showRewardAd(rewardType);
              if (result.success) {
                amounts.push(result.amount);
              }
            }
            
            // All successful ad watches should grant the same amount
            if (amounts.length > 1) {
              const firstAmount = amounts[0];
              for (const amount of amounts) {
                expect(amount).toBe(firstAmount);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
