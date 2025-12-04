import { Collectible, CollectibleType } from '@game-types/collectible';
import { Vector2D } from '@game-types/common';

/**
 * CollectibleBase - Base class for all collectible items
 */
export abstract class CollectibleBase implements Collectible {
  public readonly id: string;
  public readonly type: CollectibleType;
  public readonly position: Vector2D;
  public isCollected: boolean;

  constructor(id: string, type: CollectibleType, position: Vector2D) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.isCollected = false;
  }

  /**
   * Marks the collectible as collected
   */
  collect(): void {
    this.isCollected = true;
    this.onCollect();
  }

  /**
   * Hook for subclasses to implement collection behavior
   */
  protected abstract onCollect(): void;

  /**
   * Gets the collectible data
   */
  getData(): any {
    return {
      id: this.id,
      type: this.type
    };
  }
}
