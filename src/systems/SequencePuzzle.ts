import { PuzzleBase, PuzzleSolveContext } from './PuzzleBase';
import { PuzzleType } from '@game-types/puzzle';
import { Vector2D } from '@game-types/common';

/**
 * Sequence Puzzle - Requires actions in specific order
 */
export class SequencePuzzle extends PuzzleBase {
  private requiredSequence: string[];
  private currentSequence: string[];

  constructor(
    id: string,
    position: Vector2D,
    requiredSequence: string[],
    unlocksPath: Vector2D[] = []
  ) {
    super(id, PuzzleType.SEQUENCE_PUZZLE, position, [], unlocksPath);
    this.requiredSequence = requiredSequence;
    this.currentSequence = [];
  }

  /**
   * Checks if puzzle can be solved
   */
  canSolve(context: PuzzleSolveContext): boolean {
    if (!context.sequenceHistory || context.sequenceHistory.length === 0) {
      return false;
    }

    // Check if the sequence history matches required sequence
    const history = context.sequenceHistory;
    if (history.length < this.requiredSequence.length) {
      return false;
    }

    // Check last N actions match required sequence
    const recentActions = history.slice(-this.requiredSequence.length);
    return this.sequencesMatch(recentActions, this.requiredSequence);
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
   * Adds an action to the current sequence
   */
  addAction(action: string): boolean {
    this.currentSequence.push(action);

    // Keep only the last N actions
    if (this.currentSequence.length > this.requiredSequence.length) {
      this.currentSequence.shift();
    }

    // Check if sequence is complete
    if (this.sequencesMatch(this.currentSequence, this.requiredSequence)) {
      this.onSolved();
      return true;
    }

    return false;
  }

  /**
   * Checks if two sequences match
   */
  private sequencesMatch(seq1: string[], seq2: string[]): boolean {
    if (seq1.length !== seq2.length) {
      return false;
    }

    return seq1.every((action, index) => action === seq2[index]);
  }

  /**
   * Gets the required sequence
   */
  getRequiredSequence(): string[] {
    return [...this.requiredSequence];
  }

  /**
   * Gets the current sequence
   */
  getCurrentSequence(): string[] {
    return [...this.currentSequence];
  }

  /**
   * Resets the puzzle
   */
  protected onReset(): void {
    this.currentSequence = [];
  }
}
