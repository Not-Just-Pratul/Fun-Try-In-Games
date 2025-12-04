import { PuzzleBase, PuzzleSolveContext } from './PuzzleBase';
import { PuzzleType } from '@game-types/puzzle';
import { Vector2D } from '@game-types/common';

/**
 * Collection Puzzle - Requires collecting multiple items
 */
export class CollectionPuzzle extends PuzzleBase {
  constructor(
    id: string,
    position: Vector2D,
    requiredItems: string[],
    unlocksPath: Vector2D[] = []
  ) {
    super(id, PuzzleType.COLLECTION_PUZZLE, position, requiredItems, unlocksPath);
  }

  /**
   * Checks if puzzle can be solved
   */
  canSolve(context: PuzzleSolveContext): boolean {
    if (!context.inventory || context.inventory.length === 0) {
      return false;
    }

    // Check if all required items are in inventory
    return this.requiredItems.every(item => context.inventory.includes(item));
  }

  /**
   * Attempts to solve the puzzle
   */
  attemptSolve(context: PuzzleSolveContext): boolean {
    if (this.isSolved) {
      return true;
    }

    if (this.canSolve(context)) {
      this.onSolved();
      return true;
    }

    return false;
  }

  /**
   * Checks how many required items are collected
   */
  getCollectionProgress(inventory: string[]): { collected: number; total: number } {
    const collected = this.requiredItems.filter(item => inventory.includes(item)).length;
    return {
      collected,
      total: this.requiredItems.length
    };
  }

  /**
   * Gets missing items
   */
  getMissingItems(inventory: string[]): string[] {
    return this.requiredItems.filter(item => !inventory.includes(item));
  }

  /**
   * Resets the puzzle
   */
  protected onReset(): void {
    // Nothing special to reset for collection puzzles
  }
}
