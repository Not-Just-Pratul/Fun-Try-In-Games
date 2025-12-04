import * as fc from 'fast-check';
import { AbilityType } from '@game-types/ability';
import { AbilityBase } from '@systems/AbilityBase';

// Feature: chain-ledge-game, Property 8: Ability charge and cooldown management
// Validates: Requirements 2.5, 2.6

// Mock ability for testing
class MockAbility extends AbilityBase {
  private type: AbilityType;

  constructor(type: AbilityType, maxCharges: number, cooldownMs: number) {
    super(maxCharges, cooldownMs, 0);
    this.type = type;
  }

  protected onActivate(): void {
    // Mock activation
  }

  protected onDeactivate(): void {
    // Mock deactivation
  }

  getType(): AbilityType {
    return this.type;
  }
}

describe('Ability System Property Tests', () => {
  test('Property 8: Ability charge and cooldown management - Using ability decrements charges and starts cooldown', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1000, max: 5000 }),
        (maxCharges, cooldownMs) => {
          const ability = new MockAbility(AbilityType.PHASE, maxCharges, cooldownMs);
          let currentTime = 0;

          // Initial state
          expect(ability.getCharges()).toBe(maxCharges);
          expect(ability.canUse(currentTime)).toBe(true);

          // Use ability
          const success = ability.activate(currentTime);
          expect(success).toBe(true);

          // Charges should be decremented
          expect(ability.getCharges()).toBe(maxCharges - 1);

          // If we have charges left, should be able to use immediately
          if (maxCharges > 1) {
            expect(ability.canUse(currentTime + 100)).toBe(true);
          } else {
            // No charges left, can't use
            expect(ability.canUse(currentTime + 100)).toBe(false);
          }

          // After cooldown and update, charges should be restored
          currentTime = currentTime + cooldownMs + 100;
          ability.update(currentTime);
          
          // Should have one more charge now
          expect(ability.getCharges()).toBe(maxCharges);
          expect(ability.canUse(currentTime)).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8b: When cooldown completes, charges increase by one', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 1000, max: 3000 }),
        (maxCharges, cooldownMs) => {
          const ability = new MockAbility(AbilityType.SENSE, maxCharges, cooldownMs);
          let currentTime = 0;

          // Use ability
          ability.activate(currentTime);
          const chargesAfterUse = ability.getCharges();
          expect(chargesAfterUse).toBe(maxCharges - 1);

          // Update after cooldown completes
          currentTime += cooldownMs + 100;
          ability.update(currentTime);

          // Charge should be restored
          expect(ability.getCharges()).toBe(chargesAfterUse + 1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8c: Cannot use ability when charges are zero', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 500, max: 2000 }),
        (maxCharges, cooldownMs) => {
          const ability = new MockAbility(AbilityType.SPEED_BOOST, maxCharges, cooldownMs);
          let currentTime = 0;

          // Use all charges without waiting for cooldown
          for (let i = 0; i < maxCharges; i++) {
            const success = ability.activate(currentTime);
            expect(success).toBe(true);
            currentTime += 10; // Small time increment, not enough for cooldown
          }
          
          // Should have 0 charges
          expect(ability.getCharges()).toBe(0);

          // Cannot use with 0 charges
          expect(ability.canUse(currentTime)).toBe(false);
          
          // Even after trying to activate, should still fail
          const activateSuccess = ability.activate(currentTime);
          expect(activateSuccess).toBe(false);
          expect(ability.getCharges()).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8d: Charges never exceed max charges', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 500, max: 2000 }),
        (maxCharges, cooldownMs) => {
          const ability = new MockAbility(AbilityType.POSSESS, maxCharges, cooldownMs);

          // Try to add charges beyond max
          for (let i = 0; i < maxCharges + 5; i++) {
            ability.addCharge();
          }

          // Should not exceed max
          expect(ability.getCharges()).toBe(maxCharges);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
