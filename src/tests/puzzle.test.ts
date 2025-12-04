import * as fc from 'fast-check';
import { PossessionPuzzle } from '@systems/PossessionPuzzle';
import { SequencePuzzle } from '@systems/SequencePuzzle';
import { TimingPuzzle } from '@systems/TimingPuzzle';
import { CollectionPuzzle } from '@systems/CollectionPuzzle';
import { PuzzleManager } from '@systems/PuzzleManager';
import { PuzzleSolveContext } from '@systems/PuzzleBase';
import { Maze, MazeType, CellType } from '@game-types/maze';
import { Vector2D } from '@game-types/common';

// Feature: chain-ledge-game, Property 14: Puzzle solution unlocks paths
// Validates: Requirements 4.2

// Feature: chain-ledge-game, Property 15: Exit activation condition
// Validates: Requirements 4.3

/**
 * Creates a simple test maze
 */
const createTestMaze = (width: number, height: number): Maze => {
  const grid: any[][] = [];
  for (let y = 0; y < height; y++) {
    const row: any[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        position: { x, y },
        type: CellType.EMPTY,
        walls: { north: true, south: true, east: true, west: true },
        isVisible: true,
        isRevealed: false
      });
    }
    grid.push(row);
  }

  return {
    type: MazeType.LINEAR,
    grid,
    width,
    height,
    layers: 1,
    entrance: { x: 0, y: 0 },
    exit: { x: width - 1, y: height - 1 },
    obstacles: [],
    collectibles: [],
    getCell: (pos: Vector2D) => {
      if (pos.y >= 0 && pos.y < height && pos.x >= 0 && pos.x < width) {
        return grid[pos.y][pos.x];
      }
      return undefined;
    },
    isWalkable: (pos: Vector2D) => {
      const cell = grid[pos.y]?.[pos.x];
      return cell?.type === CellType.EMPTY;
    },
    isSolvable: () => true
  };
};

describe('Puzzle System Property Tests', () => {
  describe('Possession Puzzle', () => {
    test('Property 14a: Possession puzzle solves when correct object is possessed', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          (objectId, x, y) => {
            const puzzle = new PossessionPuzzle(
              'test-puzzle',
              { x, y },
              objectId,
              [{ x: x + 1, y }]
            );

            // Should not be solved initially
            expect(puzzle.getIsSolved()).toBe(false);

            // Attempt with correct object
            const context: PuzzleSolveContext = {
              playerPosition: { x, y },
              inventory: [],
              possessedObjectId: objectId
            };

            const solved = puzzle.attemptSolve(context);
            expect(solved).toBe(true);
            expect(puzzle.getIsSolved()).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 14b: Possession puzzle fails with wrong object', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (correctId, wrongId) => {
            fc.pre(correctId !== wrongId);

            const puzzle = new PossessionPuzzle(
              'test-puzzle',
              { x: 0, y: 0 },
              correctId
            );

            const context: PuzzleSolveContext = {
              playerPosition: { x: 0, y: 0 },
              inventory: [],
              possessedObjectId: wrongId
            };

            const solved = puzzle.attemptSolve(context);
            expect(solved).toBe(false);
            expect(puzzle.getIsSolved()).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Sequence Puzzle', () => {
    test('Property 14c: Sequence puzzle solves with correct sequence', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
          (sequence) => {
            const puzzle = new SequencePuzzle(
              'test-puzzle',
              { x: 0, y: 0 },
              sequence
            );

            // Add actions in correct order
            sequence.forEach(action => {
              puzzle.addAction(action);
            });

            expect(puzzle.getIsSolved()).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 14d: Sequence puzzle fails with wrong sequence', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
          (sequence) => {
            const puzzle = new SequencePuzzle(
              'test-puzzle',
              { x: 0, y: 0 },
              sequence
            );

            // Add actions in reverse order
            const reversed = [...sequence].reverse();
            fc.pre(JSON.stringify(reversed) !== JSON.stringify(sequence));

            reversed.forEach(action => {
              puzzle.addAction(action);
            });

            expect(puzzle.getIsSolved()).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Timing Puzzle', () => {
    test('Property 14e: Timing puzzle solves within time window', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 3000 }),
          fc.integer({ min: 4000, max: 6000 }),
          (windowStart, windowEnd) => {
            const puzzle = new TimingPuzzle(
              'test-puzzle',
              { x: 0, y: 0 },
              windowStart,
              windowEnd
            );

            const activationTime = 0;
            puzzle.activate(activationTime);

            // Attempt within window (midpoint)
            const attemptTime = activationTime + Math.floor((windowStart + windowEnd) / 2);
            const context: PuzzleSolveContext = {
              playerPosition: { x: 0, y: 0 },
              inventory: [],
              timestamp: attemptTime
            };

            const solved = puzzle.attemptSolve(context);
            expect(solved).toBe(true);
            expect(puzzle.getIsSolved()).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 14f: Timing puzzle fails outside time window', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 1000, max: 3000 }),
          (windowStart, windowEnd) => {
            const puzzle = new TimingPuzzle(
              'test-puzzle',
              { x: 0, y: 0 },
              windowStart,
              windowEnd
            );

            const activationTime = 0;
            puzzle.activate(activationTime);

            // Attempt too early
            const attemptTime = activationTime + windowStart - 100;
            const context: PuzzleSolveContext = {
              playerPosition: { x: 0, y: 0 },
              inventory: [],
              timestamp: attemptTime
            };

            const solved = puzzle.attemptSolve(context);
            expect(solved).toBe(false);
            expect(puzzle.getIsSolved()).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Collection Puzzle', () => {
    test('Property 14g: Collection puzzle solves with all items', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
          (requiredItems) => {
            const uniqueItems = Array.from(new Set(requiredItems));
            
            const puzzle = new CollectionPuzzle(
              'test-puzzle',
              { x: 0, y: 0 },
              uniqueItems
            );

            const context: PuzzleSolveContext = {
              playerPosition: { x: 0, y: 0 },
              inventory: uniqueItems
            };

            const solved = puzzle.attemptSolve(context);
            expect(solved).toBe(true);
            expect(puzzle.getIsSolved()).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 14h: Collection puzzle fails with missing items', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
          (requiredItems) => {
            const uniqueItems = Array.from(new Set(requiredItems));
            fc.pre(uniqueItems.length >= 2);

            const puzzle = new CollectionPuzzle(
              'test-puzzle',
              { x: 0, y: 0 },
              uniqueItems
            );

            // Only have some items
            const partialInventory = uniqueItems.slice(0, uniqueItems.length - 1);

            const context: PuzzleSolveContext = {
              playerPosition: { x: 0, y: 0 },
              inventory: partialInventory
            };

            const solved = puzzle.attemptSolve(context);
            expect(solved).toBe(false);
            expect(puzzle.getIsSolved()).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Puzzle Manager', () => {
    test('Property 14: Puzzle solution unlocks paths', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 10 }),
          fc.integer({ min: 5, max: 10 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (width, height, objectId) => {
            const maze = createTestMaze(width, height);
            const manager = new PuzzleManager(maze);

            const puzzlePos = { x: 2, y: 2 };
            const unlockedPath = { x: 3, y: 2 };

            const puzzle = new PossessionPuzzle(
              'test-puzzle',
              puzzlePos,
              objectId,
              [unlockedPath]
            );

            manager.registerPuzzle(puzzle);

            // Check path is initially locked (has walls)
            const cell = maze.getCell(unlockedPath);
            expect(cell).toBeDefined();
            const initiallyLocked = cell!.walls.north || cell!.walls.south || 
                                   cell!.walls.east || cell!.walls.west;
            expect(initiallyLocked).toBe(true);

            // Solve puzzle
            const context: PuzzleSolveContext = {
              playerPosition: puzzlePos,
              inventory: [],
              possessedObjectId: objectId
            };

            manager.attemptSolvePuzzle('test-puzzle', context);

            // Path should be unlocked (no walls)
            const unlockedCell = maze.getCell(unlockedPath);
            expect(unlockedCell!.walls.north).toBe(false);
            expect(unlockedCell!.walls.south).toBe(false);
            expect(unlockedCell!.walls.east).toBe(false);
            expect(unlockedCell!.walls.west).toBe(false);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Property 15: All puzzles must be solved for exit activation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (puzzleCount) => {
            const maze = createTestMaze(10, 10);
            const manager = new PuzzleManager(maze);

            // Create multiple puzzles
            for (let i = 0; i < puzzleCount; i++) {
              const puzzle = new CollectionPuzzle(
                `puzzle-${i}`,
                { x: i, y: 0 },
                [`item-${i}`]
              );
              manager.registerPuzzle(puzzle);
            }

            // Initially, not all puzzles are solved
            expect(manager.areAllPuzzlesSolved()).toBe(false);

            // Solve all but one
            for (let i = 0; i < puzzleCount - 1; i++) {
              const context: PuzzleSolveContext = {
                playerPosition: { x: i, y: 0 },
                inventory: [`item-${i}`]
              };
              manager.attemptSolvePuzzle(`puzzle-${i}`, context);
            }

            // Still not all solved
            expect(manager.areAllPuzzlesSolved()).toBe(false);

            // Solve the last one
            const lastContext: PuzzleSolveContext = {
              playerPosition: { x: puzzleCount - 1, y: 0 },
              inventory: [`item-${puzzleCount - 1}`]
            };
            manager.attemptSolvePuzzle(`puzzle-${puzzleCount - 1}`, lastContext);

            // Now all should be solved
            expect(manager.areAllPuzzlesSolved()).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
