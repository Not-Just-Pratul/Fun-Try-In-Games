import { CollectibleBase } from './CollectibleBase';
import { CollectibleType } from '@game-types/collectible';
import { AbilityType } from '@game-types/ability';
import { Vector2D } from '@game-types/common';

/**
 * AbilityChargeCollectible - Restores ability charges when collected
 */
export class AbilityChargeCollectible extends CollectibleBase {
  private readonly abilityType: AbilityType;
  private readonly chargeAmount: number;

  constructor(
    id: string,
    position: Vector2D,
    abilityType: AbilityType,
    chargeAmount: number = 1
  ) {
    super(id, CollectibleType.ABILITY_CHARGE, position);
    this.abilityType = abilityType;
    this.chargeAmount = chargeAmount;
  }

  protected onCollect(): void {
    // Ability charge collection behavior - add charges to ability system
  }

  getAbilityType(): AbilityType {
    return this.abilityType;
  }

  getChargeAmount(): number {
    return this.chargeAmount;
  }

  getData(): any {
    return {
      ...super.getData(),
      abilityType: this.abilityType,
      chargeAmount: this.chargeAmount
    };
  }
}
