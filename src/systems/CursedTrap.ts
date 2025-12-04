import { ObstacleBase } from './ObstacleBase';
import { Vector2D } from '@game-types/common';
import { ObstacleType } from '@game-types/obstacle';

/**
 * Effect types for cursed traps
 */
export enum TrapEffectType {
  COOLDOWN_INCREASE = 'COOLDOWN_INCREASE',
  MOVEMENT_RESTRICTION = 'MOVEMENT_RESTRICTION',
  ABILITY_DISABLE = 'ABILITY_DISABLE'
}

/**
 * Trap effect configuration
 */
export interface TrapEffect {
  type: TrapEffectType;
  duration: number; // milliseconds
  magnitude: number; // multiplier or value
}

/**
 * CursedTrap - Triggers effects when player enters zone
 */
export class CursedTrap extends ObstacleBase {
  private triggerRadius: number;
  private effect: TrapEffect;
  private cooldown: number;
  private lastTriggerTime: number;
  private isTriggered: boolean;

  constructor(
    id: string,
    position: Vector2D,
    effect: TrapEffect,
    triggerRadius: number = 20,
    cooldown: number = 5000
  ) {
    super(id, ObstacleType.CURSED_TRAP, position);
    this.triggerRadius = triggerRadius;
    this.effect = effect;
    this.cooldown = cooldown;
    this.lastTriggerTime = 0;
    this.isTriggered = false;
  }

  /**
   * Updates the trap state
   */
  update(deltaTime: number): void {
    if (!this.isActive) {
      return;
    }

    // Reset triggered state after cooldown
    if (this.isTriggered && Date.now() - this.lastTriggerTime > this.cooldown) {
      this.isTriggered = false;
    }
  }

  /**
   * Checks collision and triggers effect
   */
  checkCollision(position: Vector2D, radius: number = 0): boolean {
    if (!this.isActive || this.isTriggered) {
      return false;
    }

    const dx = this.position.x - position.x;
    const dy = this.position.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const collides = distance < (this.triggerRadius + radius);

    if (collides) {
      this.trigger();
    }

    return collides;
  }

  /**
   * Triggers the trap effect
   */
  private trigger(): void {
    this.isTriggered = true;
    this.lastTriggerTime = Date.now();
  }

  /**
   * Gets the trap effect
   */
  getEffect(): TrapEffect {
    return { ...this.effect };
  }

  /**
   * Gets the trigger radius
   */
  getTriggerRadius(): number {
    return this.triggerRadius;
  }

  /**
   * Checks if trap is currently triggered
   */
  getIsTriggered(): boolean {
    return this.isTriggered;
  }

  /**
   * Gets time until trap can trigger again
   */
  getRemainingCooldown(): number {
    if (!this.isTriggered) {
      return 0;
    }

    const elapsed = Date.now() - this.lastTriggerTime;
    return Math.max(0, this.cooldown - elapsed);
  }

  /**
   * Resets the trap
   */
  reset(): void {
    this.isTriggered = false;
    this.lastTriggerTime = 0;
    this.isActive = true;
  }
}
