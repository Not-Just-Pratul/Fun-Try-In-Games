import * as fc from 'fast-check';
import { InventorySystem } from '@systems/InventorySystem';
import { ClueCollectible } from '@systems/ClueCollectible';
import { LoreCollectible } from '@systems/LoreCollectible';
import { AbilityChargeCollectible } from '@systems/AbilityChargeCollectible';
import { CosmeticCollectible } from '@systems/CosmeticCollectible';
import { CollectibleType } from '@game-types/collectible';
import { AbilityType } from '@game-types/ability';
import { Vector2D } from '@game-types/common';

// Feature: chain-ledge-game, Property 18: Collection addition
// Validates: Requirements 5.2, 9.1

describe('Collectible System Property Tests', () => {
  test('Property 18: Collection addition - Collecting a clue adds it to inventory', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (clueId, x, y, hintText, puzzleId) => {
          const inventory = new InventorySystem();
          const position: Vector2D = { x, y };
          
          // Create a clue collectible
          const clue = new ClueCollectible(clueId, position, hintText, puzzleId);
          
          // Initially not in inventory
          expect(inventory.hasClue(clueId)).toBe(false);
          expect(inventory.getClues().length).toBe(0);
          
          // Collect the clue
          const success = inventory.addCollectible(clue);
          
          // Should be added successfully
          expect(success).toBe(true);
          expect(clue.isCollected).toBe(true);
          
          // Should now be in inventory
          expect(inventory.hasClue(clueId)).toBe(true);
          expect(inventory.getClues()).toContain(clueId);
          expect(inventory.getClues().length).toBe(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 18b: Collection addition - Collecting a lore item adds it to inventory', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (loreId, x, y, title, description, storyContent) => {
          const inventory = new InventorySystem();
          const position: Vector2D = { x, y };
          
          // Create a lore collectible
          const lore = new LoreCollectible(loreId, position, title, description, storyContent);
          
          // Initially not in inventory
          expect(inventory.hasLoreItem(loreId)).toBe(false);
          expect(inventory.getLoreItems().length).toBe(0);
          
          // Collect the lore item
          const success = inventory.addCollectible(lore);
          
          // Should be added successfully
          expect(success).toBe(true);
          expect(lore.isCollected).toBe(true);
          
          // Should now be in inventory
          expect(inventory.hasLoreItem(loreId)).toBe(true);
          expect(inventory.getLoreItems()).toContain(loreId);
          expect(inventory.getLoreItems().length).toBe(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 18c: Collection addition - Collecting ability charges adds them to inventory', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.constantFrom(AbilityType.PHASE, AbilityType.POSSESS, AbilityType.SENSE, AbilityType.SPEED_BOOST),
        fc.integer({ min: 1, max: 5 }),
        (chargeId, x, y, abilityType, chargeAmount) => {
          const inventory = new InventorySystem();
          const position: Vector2D = { x, y };
          
          // Create an ability charge collectible
          const charge = new AbilityChargeCollectible(chargeId, position, abilityType, chargeAmount);
          
          // Initially no charges
          const initialCharges = inventory.getAbilityCharges(abilityType);
          
          // Collect the charge
          const success = inventory.addCollectible(charge);
          
          // Should be added successfully
          expect(success).toBe(true);
          expect(charge.isCollected).toBe(true);
          
          // Should have increased charges
          const newCharges = inventory.getAbilityCharges(abilityType);
          expect(newCharges).toBe(initialCharges + chargeAmount);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 18d: Collection addition - Collecting a cosmetic adds it to inventory', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (collectibleId, x, y, cosmeticId, cosmeticName, cosmeticDescription) => {
          const inventory = new InventorySystem();
          const position: Vector2D = { x, y };
          
          // Create a cosmetic collectible
          const cosmetic = new CosmeticCollectible(
            collectibleId,
            position,
            cosmeticId,
            cosmeticName,
            cosmeticDescription
          );
          
          // Initially not in inventory
          expect(inventory.hasCosmetic(cosmeticId)).toBe(false);
          expect(inventory.getCosmetics().length).toBe(0);
          
          // Collect the cosmetic
          const success = inventory.addCollectible(cosmetic);
          
          // Should be added successfully
          expect(success).toBe(true);
          expect(cosmetic.isCollected).toBe(true);
          
          // Should now be in inventory
          expect(inventory.hasCosmetic(cosmeticId)).toBe(true);
          expect(inventory.getCosmetics()).toContain(cosmeticId);
          expect(inventory.getCosmetics().length).toBe(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 18e: Collection addition - Collecting multiple items of different types', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        (clueIds, loreIds, cosmeticIds) => {
          const inventory = new InventorySystem();
          const position: Vector2D = { x: 100, y: 100 };
          
          // Collect all clues
          clueIds.forEach(id => {
            const clue = new ClueCollectible(id, position, 'hint', 'puzzle');
            inventory.addCollectible(clue);
          });
          
          // Collect all lore items
          loreIds.forEach(id => {
            const lore = new LoreCollectible(id, position, 'title', 'desc', 'story');
            inventory.addCollectible(lore);
          });
          
          // Collect all cosmetics
          cosmeticIds.forEach(id => {
            const cosmetic = new CosmeticCollectible(id, position, id, 'name', 'desc');
            inventory.addCollectible(cosmetic);
          });
          
          // Verify all items are in inventory
          const uniqueClues = [...new Set(clueIds)];
          const uniqueLore = [...new Set(loreIds)];
          const uniqueCosmetics = [...new Set(cosmeticIds)];
          
          expect(inventory.getClues().length).toBe(uniqueClues.length);
          expect(inventory.getLoreItems().length).toBe(uniqueLore.length);
          expect(inventory.getCosmetics().length).toBe(uniqueCosmetics.length);
          
          // Verify each item is accessible
          uniqueClues.forEach(id => expect(inventory.hasClue(id)).toBe(true));
          uniqueLore.forEach(id => expect(inventory.hasLoreItem(id)).toBe(true));
          uniqueCosmetics.forEach(id => expect(inventory.hasCosmetic(id)).toBe(true));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 18f: Collection addition - Cannot collect the same item twice', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (clueId, x, y) => {
          const inventory = new InventorySystem();
          const position: Vector2D = { x, y };
          
          // Create a clue collectible
          const clue = new ClueCollectible(clueId, position, 'hint', 'puzzle');
          
          // Collect the clue first time
          const firstSuccess = inventory.addCollectible(clue);
          expect(firstSuccess).toBe(true);
          expect(inventory.getClues().length).toBe(1);
          
          // Try to collect the same clue again (already marked as collected)
          const secondSuccess = inventory.addCollectible(clue);
          expect(secondSuccess).toBe(false);
          
          // Should still only have one clue
          expect(inventory.getClues().length).toBe(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 18g: Collection addition - Ability charges accumulate', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(AbilityType.PHASE, AbilityType.POSSESS, AbilityType.SENSE, AbilityType.SPEED_BOOST),
        fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 1, maxLength: 5 }),
        (abilityType, chargeAmounts) => {
          const inventory = new InventorySystem();
          const position: Vector2D = { x: 100, y: 100 };
          
          let expectedTotal = 0;
          
          // Collect multiple charge items
          chargeAmounts.forEach((amount, index) => {
            const charge = new AbilityChargeCollectible(
              `charge-${index}`,
              position,
              abilityType,
              amount
            );
            inventory.addCollectible(charge);
            expectedTotal += amount;
          });
          
          // Verify charges accumulated correctly
          const actualCharges = inventory.getAbilityCharges(abilityType);
          expect(actualCharges).toBe(expectedTotal);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
