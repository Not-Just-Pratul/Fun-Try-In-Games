import { PuzzleBase, PuzzleSolveContext } from './PuzzleBase';
import { PuzzleType } from '@game-types/puzzle';
import { Vector2D } from '@game-types/common';

/**
 * Possession Puzzle - Requires possessing a specific object
 */
export class PossessionPuzzle extends PuzzleBase {
  private targetObjectId: string;

  constructor(
    id: string,
    position: Vector2D,
    targetObjectId: string,
    unlocksPath: Vector2D[] = []
  ) {
    super(id, PuzzleType.POSSESSION_PUZZLE, position, [], unlocksPath);
    this.targetObjectId = targetObjectId;
  }

  /**
   * Checks if puzzle can be solved
   */
  canSolve(context: PuzzleSolveContext): boolean {
    return context.possessedObjectId === this.targetObjectId;
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
   * Gets the target object ID
   */
  getTargetObjectId(): string {
    return this.targetObjectId;
  }

  /**
   * Resets the puzzle
   */
  protected onReset(): void {
    // Nothing special to reset for possession puzzles
  }
}
