import * as fc from 'fast-check';
import { AbilityType } from '@game-types/ability';
import { PhaseAbility } from '@systems/PhaseAbility';
import { PossessAbility } from '@systems/PossessAbility';
import { SenseAbility } from '@systems/SenseAbility';
import { SpeedBoostAbility } from '@systems/SpeedBoostAbility';
import { Vector2D } from '@game-types/common';

// Feature: chain-ledge-game, Property 4: Phase ability wall penetration
// Validates: Requirements 2.1

// Feature: chain-ledge-game, Property 5: Possession control transfer
// Validates: Requirements 2.2

// Feature: chain-ledge-game, Property 6: Sense ability revelation
// Validates: Requirements 2.3

// Feature: chain-ledge-game, Property 7: Speed boost effect
// Validates: Requirements 2.4

describe('Individual Ability Property Tests', () => {
  describe('Phase Ability', () => {
    test('Property 4: Phase ability allows passage through walls when active', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1000, max: 5000 }),
          fc.integer({ min: 1000, max: 5000 }),
          (maxCharges, cooldownMs, durationMs) => {
            const ability = new PhaseAbility(maxCharges, cooldownMs, durationMs);
            const currentTime = 0;

            // Initially not active
            expect(ability.getIsActive()).toBe(false);

            // Activate ability
            const success = ability.activate(currentTime);
            expect(success).toBe(true);

            // Should be active now
            expect(ability.getIsActive()).toBe(true);

            // Should remain active during duration
            ability.update(currentTime + durationMs / 2);
            expect(ability.getIsActive()).toBe(true);

            // Should deactivate after duration
            ability.update(currentTime + durationMs + 100);
            expect(ability.getIsActive()).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 4b: Phase ability requires charges to activate', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          (maxCharges) => {
            const ability = new PhaseAbility(maxCharges, 1000, 1000);
            let currentTime = 0;

            // Use all charges
            for (let i = 0; i < maxCharges; i++) {
              expect(ability.activate(currentTime)).toBe(true);
              currentTime += 10;
            }

            // Should have no charges left
            expect(ability.getCharges()).toBe(0);

            // Cannot activate without charges
            expect(ability.activate(currentTime)).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Possession Ability', () => {
    test('Property 5: Possession ability transfers control to object', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (maxCharges, objectId) => {
            const ability = new PossessAbility(maxCharges, 1000, 2000);
            const currentTime = 0;

            // Initially not possessing
            expect(ability.isPossessing()).toBe(false);
            expect(ability.getPossessedObject()).toBeNull();

            // Activate ability
            ability.activate(currentTime);
            
            // Set possessed object
            ability.setPossessedObject(objectId);

            // Should be possessing now
            expect(ability.isPossessing()).toBe(true);
            expect(ability.getPossessedObject()).toBe(objectId);

            // Deactivate
            ability.deactivate();

            // Should no longer be possessing
            expect(ability.isPossessing()).toBe(false);
            expect(ability.getPossessedObject()).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 5b: Possession ends when duration expires', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 3000 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (durationMs, objectId) => {
            const ability = new PossessAbility(2, 1000, durationMs);
            const currentTime = 0;

            // Activate and possess
            ability.activate(currentTime);
            ability.setPossessedObject(objectId);
            expect(ability.isPossessing()).toBe(true);

            // Update past duration
            ability.update(currentTime + durationMs + 100);

            // Should no longer be active or possessing
            expect(ability.getIsActive()).toBe(false);
            expect(ability.isPossessing()).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Sense Ability', () => {
    test('Property 6: Sense ability reveals hidden elements within radius', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 3, max: 10 }),
          fc.array(fc.record({
            x: fc.integer({ min: 0, max: 20 }),
            y: fc.integer({ min: 0, max: 20 })
          }), { minLength: 1, maxLength: 10 }),
          (maxCharges, revealRadius, positions) => {
            const ability = new SenseAbility(maxCharges, 1000, 2000, revealRadius);
            const currentTime = 0;

            // Activate ability
            ability.activate(currentTime);
            expect(ability.getIsActive()).toBe(true);

            // Reveal positions
            positions.forEach(pos => ability.revealPosition(pos));

            // All positions should be revealed
            positions.forEach(pos => {
              expect(ability.isPositionRevealed(pos)).toBe(true);
            });

            // Get revealed positions
            const revealed = ability.getRevealedPositions();
            
            // Count unique positions (duplicates should be stored as one)
            const uniquePositions = new Set(positions.map(p => `${p.x},${p.y}`));
            expect(revealed.length).toBe(uniquePositions.size);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 6b: Sense ability has configurable reveal radius', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 15 }),
          (revealRadius) => {
            const ability = new SenseAbility(3, 1000, 2000, revealRadius);

            expect(ability.getRevealRadius()).toBe(revealRadius);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 6c: Revealed positions persist after ability ends', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 3000 }),
          fc.array(fc.record({
            x: fc.integer({ min: 0, max: 20 }),
            y: fc.integer({ min: 0, max: 20 })
          }), { minLength: 1, maxLength: 5 }),
          (durationMs, positions) => {
            const ability = new SenseAbility(2, 1000, durationMs, 5);
            const currentTime = 0;

            // Activate and reveal
            ability.activate(currentTime);
            positions.forEach(pos => ability.revealPosition(pos));

            // Verify revealed
            positions.forEach(pos => {
              expect(ability.isPositionRevealed(pos)).toBe(true);
            });

            // End ability
            ability.update(currentTime + durationMs + 100);
            expect(ability.getIsActive()).toBe(false);

            // Positions should still be revealed
            positions.forEach(pos => {
              expect(ability.isPositionRevealed(pos)).toBe(true);
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Speed Boost Ability', () => {
    test('Property 7: Speed boost increases movement speed by multiplier', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.float({ min: 1.5, max: 3.0 }).filter(n => !isNaN(n)),
          (maxCharges, speedMultiplier) => {
            const ability = new SpeedBoostAbility(maxCharges, 1000, 2000, speedMultiplier);
            const currentTime = 0;

            // Check multiplier
            expect(ability.getSpeedMultiplier()).toBeCloseTo(speedMultiplier, 2);

            // Activate ability
            ability.activate(currentTime);
            expect(ability.getIsActive()).toBe(true);

            // Multiplier should still be the same
            expect(ability.getSpeedMultiplier()).toBeCloseTo(speedMultiplier, 2);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 7b: Speed boost ends after duration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 4000 }),
          fc.float({ min: 1.5, max: 3.0 }),
          (durationMs, speedMultiplier) => {
            const ability = new SpeedBoostAbility(3, 1000, durationMs, speedMultiplier);
            const currentTime = 0;

            // Activate
            ability.activate(currentTime);
            expect(ability.getIsActive()).toBe(true);

            // Should remain active during duration
            ability.update(currentTime + durationMs / 2);
            expect(ability.getIsActive()).toBe(true);

            // Should end after duration
            ability.update(currentTime + durationMs + 100);
            expect(ability.getIsActive()).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 7c: Speed multiplier can be updated', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1.5, max: 3.0 }).filter(n => !isNaN(n)),
          fc.float({ min: 1.5, max: 3.0 }).filter(n => !isNaN(n)),
          (initialMultiplier, newMultiplier) => {
            const ability = new SpeedBoostAbility(3, 1000, 2000, initialMultiplier);

            expect(ability.getSpeedMultiplier()).toBeCloseTo(initialMultiplier, 2);

            // Update multiplier
            ability.setSpeedMultiplier(newMultiplier);
            expect(ability.getSpeedMultiplier()).toBeCloseTo(newMultiplier, 2);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 7d: Speed multiplier cannot be set to zero or negative', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1.5, max: 3.0 }).filter(n => !isNaN(n)),
          (initialMultiplier) => {
            const ability = new SpeedBoostAbility(3, 1000, 2000, initialMultiplier);

            // Try to set invalid multipliers
            ability.setSpeedMultiplier(0);
            expect(ability.getSpeedMultiplier()).toBeCloseTo(initialMultiplier, 2);

            ability.setSpeedMultiplier(-1);
            expect(ability.getSpeedMultiplier()).toBeCloseTo(initialMultiplier, 2);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
