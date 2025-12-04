import * as fc from 'fast-check';
import { HintSystem, HintContext, HintType } from '@systems/HintSystem';
import { MazeType, CellType } from '@game-types/maze';
import { PuzzleType } from '@game-types/puzzle';

// Helper to create a simple maze
const createSimpleMaze = () => ({
  type: MazeType.LINEAR,
  grid: [],
  width: 20,
  height: 20,
  layers: 1,
  entrance: { x: 0, y: 0 },
  exit: { x: 19, y: 19 },
  obstacles: [],
  collectibles: [],
  getCell: () => ({ position: { x: 0, y: 0 }, type: CellType.EMPTY, walls: { north: false, south: false, east: false, west: false }, isVisible: true, isRevealed: true }),
  isWalkable: () => true,
  isSolvable: () => true,
});

// Helper to create a puzzle element
const createPuzzle = (id: string, x: number, y: number) => ({
  id,
  type: PuzzleType.COLLECTION_PUZZLE,
  position: { x, y },
  isSolved: false,
  requiredItems: ['item1'],
  unlocksPath: [{ x: 10, y: 10 }],
  solve: () => true,
  getType: () => PuzzleType.COLLECTION_PUZZLE,
  getPosition: () => ({ x, y }),
  getIsSolved: () => false,
  getId: () => id,
  getRequiredItems: () => ['item1'],
  getUnlocksPath: () => [{ x: 10, y: 10 }],
});

// Feature: chain-ledge-game, Property 21: Hint availability after cooldown
// Validates: Requirements 6.1, 6.2

describe('HintSystem Property Tests', () => {
  describe('Property 21: Hint availability after cooldown', () => {
    test('Requesting a hint with available charges and elapsed cooldown provides a hint', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // initial charges
          fc.integer({ min: 1000, max: 10000 }), // cooldown duration
          (initialCharges, cooldownMs) => {
            const hintSystem = new HintSystem(cooldownMs, initialCharges);
            
            const context: HintContext = {
              currentMaze: createSimpleMaze(),
              ghostPosition: { x: 5, y: 5 },
              unsolvedPuzzles: [],
            };
            
            // Should be able to provide hint initially (cooldown elapsed)
            expect(hintSystem.canProvideHint()).toBe(true);
            
            // Request hint
            const hint = hintSystem.requestHint(context);
            
            // Verify hint was provided
            expect(hint).not.toBeNull();
            expect(hint!.message).toBeDefined();
            expect(hint!.type).toBeDefined();
            expect(hint!.highlightDuration).toBeGreaterThan(0);
            
            // Verify charges decreased
            expect(hintSystem.getAvailableCharges()).toBe(initialCharges - 1);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Requesting a hint starts cooldown timer', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5000, max: 30000 }), // cooldown duration
          (cooldownMs) => {
            const hintSystem = new HintSystem(cooldownMs, 3);
            
            const context: HintContext = {
              currentMaze: createSimpleMaze(),
              ghostPosition: { x: 5, y: 5 },
              unsolvedPuzzles: [],
            };
            
            // Request hint
            hintSystem.requestHint(context);
            
            // Verify cooldown is active
            const remainingCooldown = hintSystem.getRemainingCooldown();
            expect(remainingCooldown).toBeGreaterThan(0);
            expect(remainingCooldown).toBeLessThanOrEqual(cooldownMs);
            
            // Should not be able to provide hint immediately
            expect(hintSystem.canProvideHint()).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Cannot request hint when cooldown is active', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5000, max: 30000 }), // cooldown duration
          fc.integer({ min: 2, max: 5 }), // initial charges
          (cooldownMs, initialCharges) => {
            const hintSystem = new HintSystem(cooldownMs, initialCharges);
            
            const context: HintContext = {
              currentMaze: createSimpleMaze(),
              ghostPosition: { x: 5, y: 5 },
              unsolvedPuzzles: [],
            };
            
            // Request first hint
            const hint1 = hintSystem.requestHint(context);
            expect(hint1).not.toBeNull();
            
            // Try to request second hint immediately (should fail due to cooldown)
            const hint2 = hintSystem.requestHint(context);
            expect(hint2).toBeNull();
            
            // Verify charges only decreased once
            expect(hintSystem.getAvailableCharges()).toBe(initialCharges - 1);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Cannot request hint when no charges available', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000 }), // cooldown duration
          (cooldownMs) => {
            const hintSystem = new HintSystem(cooldownMs, 0); // No charges
            
            const context: HintContext = {
              currentMaze: createSimpleMaze(),
              ghostPosition: { x: 5, y: 5 },
              unsolvedPuzzles: [],
            };
            
            // Should not be able to provide hint
            expect(hintSystem.canProvideHint()).toBe(false);
            
            // Request hint should return null
            const hint = hintSystem.requestHint(context);
            expect(hint).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Cooldown decreases over time', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5000, max: 30000 }), // cooldown duration
          async (cooldownMs) => {
            const hintSystem = new HintSystem(cooldownMs, 3);
            
            const context: HintContext = {
              currentMaze: createSimpleMaze(),
              ghostPosition: { x: 5, y: 5 },
              unsolvedPuzzles: [],
            };
            
            // Request hint
            hintSystem.requestHint(context);
            
            const cooldown1 = hintSystem.getRemainingCooldown();
            
            // Wait a bit (simulate time passing)
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const cooldown2 = hintSystem.getRemainingCooldown();
            
            // Cooldown should have decreased
            expect(cooldown2).toBeLessThan(cooldown1);
            
            return true;
          }
        ),
        { numRuns: 10 } // Reduced runs for async test
      );
    });

    test('Hint provides contextual information based on game state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 19 }), // ghost x position
          fc.integer({ min: 0, max: 19 }), // ghost y position
          fc.integer({ min: 0, max: 3 }), // number of unsolved puzzles
          (ghostX, ghostY, puzzleCount) => {
            const hintSystem = new HintSystem(30000, 3);
            
            // Create unsolved puzzles
            const unsolvedPuzzles = [];
            for (let i = 0; i < puzzleCount; i++) {
              unsolvedPuzzles.push(createPuzzle(`puzzle${i}`, 10 + i, 10 + i));
            }
            
            const context: HintContext = {
              currentMaze: createSimpleMaze(),
              ghostPosition: { x: ghostX, y: ghostY },
              unsolvedPuzzles,
            };
            
            const hint = hintSystem.requestHint(context);
            
            // Verify hint is contextual
            expect(hint).not.toBeNull();
            expect(hint!.message).toBeDefined();
            expect(hint!.message.length).toBeGreaterThan(0);
            
            // If there are puzzles, hint should be about puzzles
            if (puzzleCount > 0) {
              expect(hint!.type).toBe(HintType.PUZZLE_CLUE);
              expect(hint!.targetPosition).toBeDefined();
            } else {
              // Otherwise, should be directional
              expect(hint!.type).toBe(HintType.DIRECTIONAL);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: chain-ledge-game, Property 22: Ad reward grants hint charge
  // Validates: Requirements 6.3

  describe('Property 22: Ad reward grants hint charge', () => {
    test('Adding a charge increases available charges', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 4 }), // initial charges (less than max)
          (initialCharges) => {
            const maxCharges = 5;
            const hintSystem = new HintSystem(30000, initialCharges, maxCharges);
            
            const chargesBefore = hintSystem.getAvailableCharges();
            
            // Add charge (simulate ad reward)
            hintSystem.addCharge();
            
            const chargesAfter = hintSystem.getAvailableCharges();
            
            // Verify charge was added
            if (chargesBefore < maxCharges) {
              expect(chargesAfter).toBe(chargesBefore + 1);
            } else {
              // Already at max, should stay at max
              expect(chargesAfter).toBe(maxCharges);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Adding charge does not exceed maximum', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }), // max charges
          fc.integer({ min: 1, max: 5 }), // charges to add
          (maxCharges, chargesToAdd) => {
            const hintSystem = new HintSystem(30000, maxCharges, maxCharges);
            
            // Try to add multiple charges
            for (let i = 0; i < chargesToAdd; i++) {
              hintSystem.addCharge();
            }
            
            // Verify charges don't exceed max
            expect(hintSystem.getAvailableCharges()).toBeLessThanOrEqual(maxCharges);
            expect(hintSystem.getAvailableCharges()).toBe(maxCharges);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Adding charge when at zero makes hints available', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000 }), // cooldown duration
          (cooldownMs) => {
            const hintSystem = new HintSystem(cooldownMs, 0); // Start with no charges
            
            // Should not be able to provide hint
            expect(hintSystem.canProvideHint()).toBe(false);
            
            // Add charge
            hintSystem.addCharge();
            
            // Now should be able to provide hint (if cooldown elapsed)
            expect(hintSystem.getAvailableCharges()).toBe(1);
            expect(hintSystem.canProvideHint()).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Multiple ad rewards accumulate charges up to max', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 8 }), // max charges
          fc.integer({ min: 1, max: 10 }), // number of ads watched
          (maxCharges, adsWatched) => {
            const hintSystem = new HintSystem(30000, 0, maxCharges);
            
            // Watch multiple ads
            for (let i = 0; i < adsWatched; i++) {
              hintSystem.addCharge();
            }
            
            // Verify charges accumulated correctly
            const expectedCharges = Math.min(adsWatched, maxCharges);
            expect(hintSystem.getAvailableCharges()).toBe(expectedCharges);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional tests for hint system behavior

  describe('Hint System General Behavior', () => {
    test('Reset adds one charge and clears cooldown', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }), // initial charges
          fc.integer({ min: 3, max: 10 }), // max charges
          (initialCharges, maxCharges) => {
            const hintSystem = new HintSystem(30000, initialCharges, maxCharges);
            
            const context: HintContext = {
              currentMaze: createSimpleMaze(),
              ghostPosition: { x: 5, y: 5 },
              unsolvedPuzzles: [],
            };
            
            // Request hint to start cooldown
            hintSystem.requestHint(context);
            
            const chargesAfterHint = hintSystem.getAvailableCharges();
            expect(hintSystem.getRemainingCooldown()).toBeGreaterThan(0);
            
            // Reset
            hintSystem.reset();
            
            // Verify cooldown cleared
            expect(hintSystem.getRemainingCooldown()).toBe(0);
            
            // Verify charge added (up to max)
            const expectedCharges = Math.min(chargesAfterHint + 1, maxCharges);
            expect(hintSystem.getAvailableCharges()).toBe(expectedCharges);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Hint highlight duration is always positive', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 19 }), // ghost x
          fc.integer({ min: 0, max: 19 }), // ghost y
          (ghostX, ghostY) => {
            const hintSystem = new HintSystem(30000, 3);
            
            const context: HintContext = {
              currentMaze: createSimpleMaze(),
              ghostPosition: { x: ghostX, y: ghostY },
              unsolvedPuzzles: [],
            };
            
            const hint = hintSystem.requestHint(context);
            
            expect(hint).not.toBeNull();
            expect(hint!.highlightDuration).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
