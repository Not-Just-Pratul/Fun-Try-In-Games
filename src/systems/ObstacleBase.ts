import { Vector2D } from '@game-types/common';
import { ObstacleType } from '@game-types/obstacle';

/**
 * Base class for all obstacles
 */
export abstract class ObstacleBase {
  protected id: string;
  protected type: ObstacleType;
  protected position: Vector2D;
  protected isActive: boolean;

  constructor(id: string, type: ObstacleType, position: Vector2D) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.isActive = true;
  }

  /**
   * Gets the obstacle ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Gets the obstacle type
   */
  getType(): ObstacleType {
    return this.type;
  }

  /**
   * Gets the obstacle position
   */
  getPosition(): Vector2D {
    return { ...this.position };
  }

  /**
   * Sets the obstacle position
   */
  setPosition(position: Vector2D): void {
    this.position = { ...position };
  }

  /**
   * Checks if the obstacle is active
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Activates the obstacle
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * Deactivates the obstacle
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Updates the obstacle state
   */
  abstract update(deltaTime: number): void;

  /**
   * Checks if the obstacle collides with a position
   */
  abstract checkCollision(position: Vector2D, radius: number): boolean;

  /**
   * Resets the obstacle to initial state
   */
  abstract reset(): void;
}
