import { PuzzleType } from '@game-types/puzzle';
import { Vector2D } from '@game-types/common';

/**
 * Base class for all puzzle elements
 */
export abstract class PuzzleBase {
  protected id: string;
  protected type: PuzzleType;
  protected position: Vector2D;
  protected isSolved: boolean;
  protected requiredItems: string[];
  protected unlocksPath: Vector2D[];

  constructor(
    id: string,
    type: PuzzleType,
    position: Vector2D,
    requiredItems: string[] = [],
    unlocksPath: Vector2D[] = []
  ) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.isSolved = false;
    this.requiredItems = requiredItems;
    this.unlocksPath = unlocksPath;
  }

  /**
   * Gets the puzzle ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Gets the puzzle type
   */
  getType(): PuzzleType {
    return this.type;
  }

  /**
   * Gets the puzzle position
   */
  getPosition(): Vector2D {
    return this.position;
  }

  /**
   * Checks if the puzzle is solved
   */
  getIsSolved(): boolean {
    return this.isSolved;
  }

  /**
   * Gets required items for this puzzle
   */
  getRequiredItems(): string[] {
    return [...this.requiredItems];
  }

  /**
   * Gets the paths this puzzle unlocks
   */
  getUnlocksPath(): Vector2D[] {
    return [...this.unlocksPath];
  }

  /**
   * Attempts to solve the puzzle
   * Returns true if successfully solved
   */
  abstract attemptSolve(context: PuzzleSolveContext): boolean;

  /**
   * Validates if the puzzle can be solved with given context
   */
  abstract canSolve(context: PuzzleSolveContext): boolean;

  /**
   * Resets the puzzle to unsolved state
   */
  reset(): void {
    this.isSolved = false;
    this.onReset();
  }

  /**
   * Called when puzzle is solved
   */
  protected onSolved(): void {
    this.isSolved = true;
  }

  /**
   * Called when puzzle is reset
   */
  protected abstract onReset(): void;
}

/**
 * Context provided when attempting to solve a puzzle
 */
export interface PuzzleSolveContext {
  playerPosition: Vector2D;
  inventory: string[];
  possessedObjectId?: string;
  timestamp?: number;
  sequenceHistory?: string[];
}
