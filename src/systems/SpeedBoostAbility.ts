import { AbilityBase } from './AbilityBase';
import { AbilityType } from '@game-types/ability';

/**
 * Speed Boost Ability - Temporarily increases movement speed
 */
export class SpeedBoostAbility extends AbilityBase {
  private speedMultiplier: number;

  constructor(
    maxCharges: number = 4,
    cooldownMs: number = 4000,
    durationMs: number = 3000,
    speedMultiplier: number = 2.0
  ) {
    super(maxCharges, cooldownMs, durationMs);
    // Ensure valid multiplier
    this.speedMultiplier = (speedMultiplier > 0 && !isNaN(speedMultiplier)) ? speedMultiplier : 2.0;
  }

  protected onActivate(): void {
    // Speed boost activated
    // Movement speed should be multiplied by speedMultiplier
  }

  protected onDeactivate(): void {
    // Speed boost ended
    // Movement speed returns to normal
  }

  getType(): AbilityType {
    return AbilityType.SPEED_BOOST;
  }

  /**
   * Gets the speed multiplier
   */
  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  /**
   * Sets the speed multiplier
   */
  setSpeedMultiplier(multiplier: number): void {
    if (multiplier > 0 && !isNaN(multiplier)) {
      this.speedMultiplier = multiplier;
    }
  }
}
