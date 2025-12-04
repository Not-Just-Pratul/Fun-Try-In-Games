import { ObstacleBase } from './ObstacleBase';
import { PhantomGuard } from './PhantomGuard';
import { CursedTrap, TrapEffect } from './CursedTrap';
import { Vector2D } from '@game-types/common';

/**
 * Manages all obstacles in the game
 */
export class ObstacleManager {
  private obstacles: Map<string, ObstacleBase>;
  private checkpointPosition: Vector2D;

  constructor(checkpointPosition: Vector2D) {
    this.obstacles = new Map();
    this.checkpointPosition = checkpointPosition;
  }

  /**
   * Registers an obstacle
   */
  registerObstacle(obstacle: ObstacleBase): void {
    this.obstacles.set(obstacle.getId(), obstacle);
  }

  /**
   * Gets an obstacle by ID
   */
  getObstacle(id: string): ObstacleBase | undefined {
    return this.obstacles.get(id);
  }

  /**
   * Gets all obstacles
   */
  getAllObstacles(): ObstacleBase[] {
    return Array.from(this.obstacles.values());
  }

  /**
   * Gets all phantom guards
   */
  getPhantomGuards(): PhantomGuard[] {
    return this.getAllObstacles().filter(
      obs => obs instanceof PhantomGuard
    ) as PhantomGuard[];
  }

  /**
   * Gets all cursed traps
   */
  getCursedTraps(): CursedTrap[] {
    return this.getAllObstacles().filter(
      obs => obs instanceof CursedTrap
    ) as CursedTrap[];
  }

  /**
   * Updates all obstacles
   */
  update(deltaTime: number): void {
    this.obstacles.forEach(obstacle => {
      obstacle.update(deltaTime);
    });
  }

  /**
   * Checks collision with all guards
   * Returns the guard that collided, or undefined
   */
  checkGuardCollision(position: Vector2D, radius: number = 16): PhantomGuard | undefined {
    const guards = this.getPhantomGuards();
    
    for (const guard of guards) {
      if (guard.checkCollision(position, radius)) {
        return guard;
      }
    }

    return undefined;
  }

  /**
   * Checks collision with all traps
   * Returns the trap that was triggered, or undefined
   */
  checkTrapCollision(position: Vector2D, radius: number = 0): CursedTrap | undefined {
    const traps = this.getCursedTraps();
    
    for (const trap of traps) {
      if (trap.checkCollision(position, radius)) {
        return trap;
      }
    }

    return undefined;
  }

  /**
   * Gets the checkpoint position for respawning
   */
  getCheckpointPosition(): Vector2D {
    return { ...this.checkpointPosition };
  }

  /**
   * Sets the checkpoint position
   */
  setCheckpointPosition(position: Vector2D): void {
    this.checkpointPosition = { ...position };
  }

  /**
   * Resets all obstacles
   */
  resetAll(): void {
    this.obstacles.forEach(obstacle => obstacle.reset());
  }

  /**
   * Removes an obstacle
   */
  removeObstacle(obstacleId: string): boolean {
    return this.obstacles.delete(obstacleId);
  }

  /**
   * Clears all obstacles
   */
  clear(): void {
    this.obstacles.clear();
  }
}
