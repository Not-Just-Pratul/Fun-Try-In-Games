import { Vector2D } from '../types/common';
import { Maze } from '../types/maze';
import { PuzzleElement } from '../types/puzzle';

export enum HintType {
  DIRECTIONAL = 'DIRECTIONAL',
  PUZZLE_CLUE = 'PUZZLE_CLUE',
  ABILITY_SUGGESTION = 'ABILITY_SUGGESTION',
  COLLECTIBLE_LOCATION = 'COLLECTIBLE_LOCATION',
}

export interface Hint {
  type: HintType;
  targetPosition?: Vector2D;
  message: string;
  highlightDuration: number;
}

export interface HintContext {
  currentMaze: Maze;
  ghostPosition: Vector2D;
  unsolvedPuzzles: PuzzleElement[];
}

export class HintSystem {
  private cooldownMs: number;
  private lastHintTime: number = 0;
  private availableCharges: number;
  private maxCharges: number;

  constructor(cooldownMs: number = 30000, initialCharges: number = 3, maxCharges: number = 5) {
    this.cooldownMs = cooldownMs;
    this.availableCharges = initialCharges;
    this.maxCharges = maxCharges;
  }

  /**
   * Requests a hint based on the current game context
   * @param context The current game state context
   * @returns A hint object if available, null otherwise
   */
  requestHint(context: HintContext): Hint | null {
    if (!this.canProvideHint()) {
      return null;
    }

    // Consume a charge
    this.availableCharges--;
    this.lastHintTime = Date.now();

    // Generate contextual hint
    return this.generateContextualHint(context);
  }

  /**
   * Adds a hint charge (e.g., from watching an ad)
   */
  addCharge(): void {
    if (this.availableCharges < this.maxCharges) {
      this.availableCharges++;
    }
  }

  /**
   * Checks if a hint can be provided
   * @returns true if cooldown has elapsed and charges are available
   */
  canProvideHint(): boolean {
    const cooldownElapsed = Date.now() - this.lastHintTime >= this.cooldownMs;
    return this.availableCharges > 0 && cooldownElapsed;
  }

  /**
   * Gets the remaining cooldown time in milliseconds
   * @returns Remaining cooldown time, or 0 if cooldown has elapsed
   */
  getRemainingCooldown(): number {
    const elapsed = Date.now() - this.lastHintTime;
    const remaining = this.cooldownMs - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Gets the number of available hint charges
   */
  getAvailableCharges(): number {
    return this.availableCharges;
  }

  /**
   * Gets the maximum number of hint charges
   */
  getMaxCharges(): number {
    return this.maxCharges;
  }

  /**
   * Gets the cooldown duration in milliseconds
   */
  getCooldownMs(): number {
    return this.cooldownMs;
  }

  /**
   * Generates a contextual hint based on the game state
   * @param context The current game state
   * @returns A hint object
   */
  private generateContextualHint(context: HintContext): Hint {
    // Priority 1: Unsolved puzzles
    if (context.unsolvedPuzzles.length > 0) {
      return this.generatePuzzleHint(context);
    }

    // Priority 2: Direction to exit
    return this.generateDirectionalHint(context);
  }

  /**
   * Generates a hint for solving puzzles
   */
  private generatePuzzleHint(context: HintContext): Hint {
    const puzzle = context.unsolvedPuzzles[0];
    const puzzlePos = puzzle.position;

    // Calculate direction to puzzle
    const dx = puzzlePos.x - context.ghostPosition.x;
    const dy = puzzlePos.y - context.ghostPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let direction = '';
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'east' : 'west';
    } else {
      direction = dy > 0 ? 'south' : 'north';
    }

    let message = '';
    if (distance < 5) {
      message = `There's a puzzle nearby! Try interacting with it.`;
    } else {
      message = `Look for a puzzle to the ${direction}. It might help you progress!`;
    }

    return {
      type: HintType.PUZZLE_CLUE,
      targetPosition: puzzlePos,
      message,
      highlightDuration: 5000,
    };
  }

  /**
   * Generates a directional hint toward the exit
   */
  private generateDirectionalHint(context: HintContext): Hint {
    const exitPos = context.currentMaze.exit;
    const ghostPos = context.ghostPosition;

    // Calculate direction to exit
    const dx = exitPos.x - ghostPos.x;
    const dy = exitPos.y - ghostPos.y;

    let direction = '';
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'east' : 'west';
    } else {
      direction = dy > 0 ? 'south' : 'north';
    }

    return {
      type: HintType.DIRECTIONAL,
      targetPosition: exitPos,
      message: `The exit is to the ${direction}. Keep exploring!`,
      highlightDuration: 5000,
    };
  }

  /**
   * Resets the hint system (useful for new levels)
   */
  reset(): void {
    this.lastHintTime = 0;
    this.availableCharges = Math.min(this.availableCharges + 1, this.maxCharges);
  }
}
