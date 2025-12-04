import { PuzzleBase, PuzzleSolveContext } from './PuzzleBase';
import { PuzzleType } from '@game-types/puzzle';
import { Vector2D } from '@game-types/common';

/**
 * Timing Puzzle - Requires action within time window
 */
export class TimingPuzzle extends PuzzleBase {
  private timeWindowStart: number;
  private timeWindowEnd: number;
  private activationTime: number;
  private isActivated: boolean;

  constructor(
    id: string,
    position: Vector2D,
    timeWindowStart: number,
    timeWindowEnd: number,
    unlocksPath: Vector2D[] = []
  ) {
    super(id, PuzzleType.TIMING_PUZZLE, position, [], unlocksPath);
    this.timeWindowStart = timeWindowStart;
    this.timeWindowEnd = timeWindowEnd;
    this.activationTime = 0;
    this.isActivated = false;
  }

  /**
   * Activates the timing puzzle
   */
  activate(timestamp: number): void {
    this.activationTime = timestamp;
    this.isActivated = true;
  }

  /**
   * Checks if puzzle can be solved
   */
  canSolve(context: PuzzleSolveContext): boolean {
    if (!context.timestamp || !this.isActivated) {
      return false;
    }

    const elapsed = context.timestamp - this.activationTime;
    return elapsed >= this.timeWindowStart && elapsed <= this.timeWindowEnd;
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
   * Checks if the time window has expired
   */
  isExpired(currentTime: number): boolean {
    if (!this.isActivated) {
      return false;
    }

    const elapsed = currentTime - this.activationTime;
    return elapsed > this.timeWindowEnd;
  }

  /**
   * Gets the time window
   */
  getTimeWindow(): { start: number; end: number } {
    return {
      start: this.timeWindowStart,
      end: this.timeWindowEnd
    };
  }

  /**
   * Gets the activation time
   */
  getActivationTime(): number {
    return this.activationTime;
  }

  /**
   * Resets the puzzle
   */
  protected onReset(): void {
    this.activationTime = 0;
    this.isActivated = false;
  }
}
