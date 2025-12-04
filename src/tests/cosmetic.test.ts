import * as fc from 'fast-check';
import { CosmeticSystem, UnlockContext } from '@systems/CosmeticSystem';
import { CosmeticSkin, CosmeticRarity, UnlockConditionType } from '@game-types/cosmetic';
import { DEFAULT_COSMETIC_SKINS } from '@systems/CosmeticConfig';

// Helper to create a cosmetic skin generator
const cosmeticSkinArbitrary = (): fc.Arbitrary<CosmeticSkin> => {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    rarity: fc.constantFrom(...Object.values(CosmeticRarity)),
    unlockCondition: fc.record({
      type: fc.constantFrom(...Object.values(UnlockConditionType)),
      requirement: fc.oneof(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 100 })
      ),
      description: fc.string({ minLength: 1, maxLength: 100 }),
    }),
    spriteKey: fc.string({ minLength: 1, maxLength: 30 }),
    previewImage: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    isUnlocked: fc.boolean(),
  });
};

// Feature: chain-ledge-game, Property 32: Cosmetic application
// Validates: Requirements 9.2

describe('Cosmetic System Property Tests', () => {
  describe('Property 32: Cosmetic application', () => {
    test('For any selected cosmetic skin, the ghost should render with that skin in all subsequent gameplay', () => {
      fc.assert(
        fc.property(
          fc.array(cosmeticSkinArbitrary(), { minLength: 2, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (skins, selectionIndex) => {
            const system = new CosmeticSystem();
            
            // Register skins
            system.registerSkins(skins);
            
            // Unlock all skins for testing
            for (const skin of skins) {
              system.unlockSkin(skin.id);
            }

            // Select a skin
            const skinToSelect = skins[selectionIndex % skins.length];
            const selectSuccess = system.selectSkin(skinToSelect.id);
            
            expect(selectSuccess).toBe(true);

            // Verify the selected skin is applied
            const selectedSkin = system.getSelectedSkin();
            expect(selectedSkin).not.toBeNull();
            expect(selectedSkin?.id).toBe(skinToSelect.id);
            expect(selectedSkin?.name).toBe(skinToSelect.name);
            expect(selectedSkin?.spriteKey).toBe(skinToSelect.spriteKey);

            // Verify sprite key is correct
            const spriteKey = system.getSelectedSpriteKey();
            expect(spriteKey).toBe(skinToSelect.spriteKey);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Selecting a locked skin should fail', () => {
      fc.assert(
        fc.property(
          cosmeticSkinArbitrary(),
          (skin) => {
            const system = new CosmeticSystem();
            system.registerSkin(skin);

            // Try to select without unlocking
            const selectSuccess = system.selectSkin(skin.id);
            
            expect(selectSuccess).toBe(false);
            
            // Default skin should still be selected
            expect(system.getSelectedSkinId()).toBe('default');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Selected skin should persist through save/load', () => {
      fc.assert(
        fc.property(
          fc.array(cosmeticSkinArbitrary(), { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          (skins, selectionIndex) => {
            const system1 = new CosmeticSystem();
            
            // Register and unlock skins
            system1.registerSkins(skins);
            for (const skin of skins) {
              system1.unlockSkin(skin.id);
            }

            // Select a skin
            const skinToSelect = skins[selectionIndex % skins.length];
            system1.selectSkin(skinToSelect.id);

            // Save data
            const saveData = system1.saveCosmeticData();

            // Create new system and load data
            const system2 = new CosmeticSystem();
            system2.registerSkins(skins);
            system2.loadCosmeticData(saveData);

            // Verify selected skin is restored
            expect(system2.getSelectedSkinId()).toBe(skinToSelect.id);
            expect(system2.getSelectedSpriteKey()).toBe(skinToSelect.spriteKey);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: chain-ledge-game, Property 33: Cosmetic gameplay neutrality
  // Validates: Requirements 9.3

  describe('Property 33: Cosmetic gameplay neutrality', () => {
    test('For any two different cosmetic skins, all gameplay mechanics should function identically', () => {
      fc.assert(
        fc.property(
          cosmeticSkinArbitrary(),
          cosmeticSkinArbitrary(),
          (skin1, skin2) => {
            // Ensure different skins
            fc.pre(skin1.id !== skin2.id);

            const system1 = new CosmeticSystem();
            const system2 = new CosmeticSystem();

            // Register and unlock both skins
            system1.registerSkin(skin1);
            system1.unlockSkin(skin1.id);
            system1.selectSkin(skin1.id);

            system2.registerSkin(skin2);
            system2.unlockSkin(skin2.id);
            system2.selectSkin(skin2.id);

            // Cosmetics should not affect gameplay mechanics
            // The only difference should be visual (sprite key)
            const sprite1 = system1.getSelectedSpriteKey();
            const sprite2 = system2.getSelectedSpriteKey();

            // Sprite keys should be different (visual difference)
            expect(sprite1).not.toBe(sprite2);

            // But both systems should have the same structure
            expect(system1.getUnlockedSkins().length).toBe(system2.getUnlockedSkins().length);
            
            // Both should have a selected skin
            expect(system1.getSelectedSkin()).not.toBeNull();
            expect(system2.getSelectedSkin()).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Cosmetic selection should not affect unlock mechanics', () => {
      fc.assert(
        fc.property(
          fc.array(cosmeticSkinArbitrary(), { minLength: 3, maxLength: 10 }),
          (skins) => {
            const system = new CosmeticSystem();
            system.registerSkins(skins);

            // Unlock and select first skin
            system.unlockSkin(skins[0].id);
            system.selectSkin(skins[0].id);

            const unlockedBefore = system.getUnlockedSkins().length;

            // Unlock another skin
            system.unlockSkin(skins[1].id);

            const unlockedAfter = system.getUnlockedSkins().length;

            // Unlock count should increase regardless of selection
            expect(unlockedAfter).toBe(unlockedBefore + 1);

            // Original selection should remain
            expect(system.getSelectedSkinId()).toBe(skins[0].id);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: chain-ledge-game, Property 34: Cosmetic list accuracy
  // Validates: Requirements 9.4

  describe('Property 34: Cosmetic list accuracy', () => {
    test('For any customization interface state, displayed cosmetics should match unlocked cosmetics', () => {
      fc.assert(
        fc.property(
          fc.array(cosmeticSkinArbitrary(), { minLength: 1, maxLength: 20 }),
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 0, maxLength: 10 }),
          (skins, unlockIndices) => {
            const system = new CosmeticSystem();
            system.registerSkins(skins);

            // Unlock specific skins
            const unlockedIds = new Set<string>();
            for (const index of unlockIndices) {
              const skin = skins[index % skins.length];
              if (system.unlockSkin(skin.id)) {
                unlockedIds.add(skin.id);
              }
            }

            // Get unlocked skins from system
            const unlockedSkins = system.getUnlockedSkins();
            const unlockedSkinIds = new Set(unlockedSkins.map(s => s.id));

            // Add default skin which is always unlocked
            unlockedIds.add('default');

            // Verify all unlocked skins are in the list
            for (const id of unlockedIds) {
              expect(unlockedSkinIds.has(id)).toBe(true);
            }

            // Verify no locked skins are in the unlocked list
            const lockedSkins = system.getLockedSkins();
            for (const skin of lockedSkins) {
              expect(unlockedSkinIds.has(skin.id)).toBe(false);
            }

            // Verify total count
            expect(unlockedSkins.length + lockedSkins.length).toBe(system.getAllSkins().length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('All skins list should include both locked and unlocked skins', () => {
      fc.assert(
        fc.property(
          fc.array(cosmeticSkinArbitrary(), { minLength: 1, maxLength: 15 }),
          (skins) => {
            const system = new CosmeticSystem();
            system.registerSkins(skins);

            const allSkins = system.getAllSkins();
            const unlockedSkins = system.getUnlockedSkins();
            const lockedSkins = system.getLockedSkins();

            // All skins should be the sum of unlocked and locked
            expect(allSkins.length).toBe(unlockedSkins.length + lockedSkins.length);

            // No overlap between unlocked and locked
            const unlockedIds = new Set(unlockedSkins.map(s => s.id));
            const lockedIds = new Set(lockedSkins.map(s => s.id));

            for (const id of unlockedIds) {
              expect(lockedIds.has(id)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Filtering by rarity should return correct skins', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(CosmeticRarity)),
          (rarity) => {
            const system = new CosmeticSystem();
            system.registerSkins(DEFAULT_COSMETIC_SKINS);

            const skinsByRarity = system.getSkinsByRarity(rarity);

            // All returned skins should have the specified rarity
            for (const skin of skinsByRarity) {
              expect(skin.rarity).toBe(rarity);
            }

            // Count should match
            const expectedCount = DEFAULT_COSMETIC_SKINS.filter(s => s.rarity === rarity).length;
            expect(skinsByRarity.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cosmetic unlock conditions', () => {
    test('Auto-unlock should unlock skins that meet conditions', () => {
      const system = new CosmeticSystem();
      system.registerSkins(DEFAULT_COSMETIC_SKINS);

      const context: UnlockContext = {
        completedLevels: ['chapter1_level3'],
        completedChapters: [1],
        collectibleCount: 50,
        achievements: [],
      };

      const unlockedBefore = system.getUnlockedSkins().length;
      const newlyUnlocked = system.autoUnlockSkins(context);
      const unlockedAfter = system.getUnlockedSkins().length;

      // Should have unlocked some skins
      expect(newlyUnlocked.length).toBeGreaterThan(0);
      expect(unlockedAfter).toBe(unlockedBefore + newlyUnlocked.length);

      // Verify newly unlocked skins are actually unlocked
      for (const skinId of newlyUnlocked) {
        expect(system.isSkinUnlocked(skinId)).toBe(true);
      }
    });

    test('Cannot unlock already unlocked skins', () => {
      fc.assert(
        fc.property(
          cosmeticSkinArbitrary(),
          (skin) => {
            const system = new CosmeticSystem();
            system.registerSkin(skin);

            // Unlock once
            const firstUnlock = system.unlockSkin(skin.id);
            expect(firstUnlock).toBe(true);

            // Try to unlock again
            const secondUnlock = system.unlockSkin(skin.id);
            expect(secondUnlock).toBe(false);

            // Should still be unlocked
            expect(system.isSkinUnlocked(skin.id)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cosmetic system state management', () => {
    test('Reset should restore default state', () => {
      fc.assert(
        fc.property(
          fc.array(cosmeticSkinArbitrary(), { minLength: 2, maxLength: 10 }),
          (skins) => {
            const system = new CosmeticSystem();
            system.registerSkins(skins);

            // Unlock and select skins
            for (const skin of skins) {
              system.unlockSkin(skin.id);
            }
            system.selectSkin(skins[0].id);

            // Reset
            system.reset();

            // Should be back to default
            expect(system.getSelectedSkinId()).toBe('default');
            expect(system.getUnlockedSkins().length).toBe(1); // Only default
            expect(system.isSkinUnlocked('default')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Unlock progress should be calculated correctly', () => {
      fc.assert(
        fc.property(
          fc.array(cosmeticSkinArbitrary(), { minLength: 1, maxLength: 20 }),
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 0, maxLength: 10 }),
          (skins, unlockIndices) => {
            const system = new CosmeticSystem();
            system.registerSkins(skins);

            // Unlock specific skins
            for (const index of unlockIndices) {
              const skin = skins[index % skins.length];
              system.unlockSkin(skin.id);
            }

            const progress = system.getUnlockProgress();
            const unlockedCount = system.getUnlockedSkins().length;
            const totalCount = system.getAllSkins().length;

            const expectedProgress = (unlockedCount / totalCount) * 100;

            expect(progress).toBeCloseTo(expectedProgress, 2);
            expect(progress).toBeGreaterThanOrEqual(0);
            expect(progress).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
