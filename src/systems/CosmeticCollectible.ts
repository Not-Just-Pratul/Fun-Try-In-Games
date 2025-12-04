import { CollectibleBase } from './CollectibleBase';
import { CollectibleType } from '@game-types/collectible';
import { Vector2D } from '@game-types/common';

/**
 * CosmeticCollectible - Unlocks cosmetic items when collected
 */
export class CosmeticCollectible extends CollectibleBase {
  private readonly cosmeticId: string;
  private readonly cosmeticName: string;
  private readonly cosmeticDescription: string;

  constructor(
    id: string,
    position: Vector2D,
    cosmeticId: string,
    cosmeticName: string,
    cosmeticDescription: string
  ) {
    super(id, CollectibleType.COSMETIC_UNLOCK, position);
    this.cosmeticId = cosmeticId;
    this.cosmeticName = cosmeticName;
    this.cosmeticDescription = cosmeticDescription;
  }

  protected onCollect(): void {
    // Cosmetic collection behavior - add to cosmetics collection
  }

  getCosmeticId(): string {
    return this.cosmeticId;
  }

  getCosmeticName(): string {
    return this.cosmeticName;
  }

  getCosmeticDescription(): string {
    return this.cosmeticDescription;
  }

  getData(): any {
    return {
      ...super.getData(),
      cosmeticId: this.cosmeticId,
      cosmeticName: this.cosmeticName,
      cosmeticDescription: this.cosmeticDescription
    };
  }
}
