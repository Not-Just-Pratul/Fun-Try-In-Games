import { AbilityBase } from './AbilityBase';
import { AbilityType } from '@game-types/ability';
import { Vector2D } from '@game-types/common';

/**
 * Sense Ability - Reveals hidden routes and clues
 */
export class SenseAbility extends AbilityBase {
  private revealRadius: number;
  private revealedPositions: Set<string> = new Set();

  constructor(
    maxCharges: number = 3,
    cooldownMs: number = 6000,
    durationMs: number = 4000,
    revealRadius: number = 5
  ) {
    super(maxCharges, cooldownMs, durationMs);
    this.revealRadius = revealRadius;
  }

  protected onActivate(): void {
    // Sense ability activated
    // Will reveal hidden elements within radius
    this.revealedPositions.clear();
  }

  protected onDeactivate(): void {
    // Sense ability ended
    // Revealed positions remain visible
  }

  getType(): AbilityType {
    return AbilityType.SENSE;
  }

  /**
   * Gets the reveal radius
   */
  getRevealRadius(): number {
    return this.revealRadius;
  }

  /**
   * Marks a position as revealed
   */
  revealPosition(position: Vector2D): void {
    const key = `${position.x},${position.y}`;
    this.revealedPositions.add(key);
  }

  /**
   * Checks if a position has been revealed
   */
  isPositionRevealed(position: Vector2D): boolean {
    const key = `${position.x},${position.y}`;
    return this.revealedPositions.has(key);
  }

  /**
   * Gets all revealed positions
   */
  getRevealedPositions(): Vector2D[] {
    return Array.from(this.revealedPositions).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });
  }
}
