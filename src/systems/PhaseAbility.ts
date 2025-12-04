import { AbilityBase } from './AbilityBase';
import { AbilityType } from '@game-types/ability';

/**
 * Phase Ability - Allows ghost to pass through phasing walls
 */
export class PhaseAbility extends AbilityBase {
  constructor(maxCharges: number = 3, cooldownMs: number = 5000, durationMs: number = 3000) {
    super(maxCharges, cooldownMs, durationMs);
  }

  protected onActivate(): void {
    // Phase ability is now active
    // The maze system will check this when determining wall collision
  }

  protected onDeactivate(): void {
    // Phase ability has ended
  }

  getType(): AbilityType {
    return AbilityType.PHASE;
  }
}
