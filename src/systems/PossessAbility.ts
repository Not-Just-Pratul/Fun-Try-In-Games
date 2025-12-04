import { AbilityBase } from './AbilityBase';
import { AbilityType } from '@game-types/ability';

/**
 * Possess Ability - Allows ghost to control objects for puzzle solving
 */
export class PossessAbility extends AbilityBase {
  private possessedObjectId: string | null = null;

  constructor(maxCharges: number = 2, cooldownMs: number = 8000, durationMs: number = 5000) {
    super(maxCharges, cooldownMs, durationMs);
  }

  protected onActivate(): void {
    // Possession starts
    // The object to possess should be set via setPossessedObject
  }

  protected onDeactivate(): void {
    // Release possession
    this.possessedObjectId = null;
  }

  getType(): AbilityType {
    return AbilityType.POSSESS;
  }

  /**
   * Sets the object being possessed
   */
  setPossessedObject(objectId: string): void {
    this.possessedObjectId = objectId;
  }

  /**
   * Gets the currently possessed object ID
   */
  getPossessedObject(): string | null {
    return this.possessedObjectId;
  }

  /**
   * Checks if currently possessing an object
   */
  isPossessing(): boolean {
    return this.isActive && this.possessedObjectId !== null;
  }
}
