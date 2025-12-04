import { ObstacleBase } from './ObstacleBase';
import { Vector2D } from '@game-types/common';
import { ObstacleType } from '@game-types/obstacle';

/**
 * PhantomGuard - Patrols along a path
 */
export class PhantomGuard extends ObstacleBase {
  private patrolPath: Vector2D[];
  private currentPathIndex: number;
  private speed: number;
  private patrolDirection: number; // 1 for forward, -1 for backward
  private initialPosition: Vector2D;

  constructor(
    id: string,
    position: Vector2D,
    patrolPath: Vector2D[],
    speed: number = 0.05
  ) {
    super(id, ObstacleType.PHANTOM_GUARD, position);
    this.patrolPath = patrolPath.length > 0 ? patrolPath : [position];
    this.currentPathIndex = 0;
    this.speed = speed;
    this.patrolDirection = 1;
    this.initialPosition = { ...position };
  }

  /**
   * Updates the guard's position along patrol path
   */
  update(deltaTime: number): void {
    if (!this.isActive || this.patrolPath.length <= 1) {
      return;
    }

    // Get target position
    const target = this.patrolPath[this.currentPathIndex];
    
    // Calculate direction to target
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If close enough to target, move to next waypoint
    if (distance < 0.1) {
      this.currentPathIndex += this.patrolDirection;

      // Reverse direction at path ends
      if (this.currentPathIndex >= this.patrolPath.length) {
        this.currentPathIndex = this.patrolPath.length - 2;
        this.patrolDirection = -1;
      } else if (this.currentPathIndex < 0) {
        this.currentPathIndex = 1;
        this.patrolDirection = 1;
      }
    } else {
      // Move towards target
      const moveSpeed = this.speed * deltaTime;
      this.position.x += (dx / distance) * moveSpeed;
      this.position.y += (dy / distance) * moveSpeed;
    }
  }

  /**
   * Checks collision with a position
   */
  checkCollision(position: Vector2D, radius: number = 16): boolean {
    if (!this.isActive) {
      return false;
    }

    const dx = this.position.x - position.x;
    const dy = this.position.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < radius;
  }

  /**
   * Gets the patrol path
   */
  getPatrolPath(): Vector2D[] {
    return this.patrolPath.map(p => ({ ...p }));
  }

  /**
   * Gets the current patrol index
   */
  getCurrentPathIndex(): number {
    return this.currentPathIndex;
  }

  /**
   * Gets the patrol direction
   */
  getPatrolDirection(): number {
    return this.patrolDirection;
  }

  /**
   * Resets the guard to initial state
   */
  reset(): void {
    this.position = { ...this.initialPosition };
    this.currentPathIndex = 0;
    this.patrolDirection = 1;
    this.isActive = true;
  }
}
