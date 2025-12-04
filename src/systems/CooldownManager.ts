import { AbilityType } from '@game-types/ability';

/**
 * Manages cooldowns for all abilities
 */
export class CooldownManager {
  private cooldowns: Map<AbilityType, number>;
  private cooldownDurations: Map<AbilityType, number>;

  constructor() {
    this.cooldowns = new Map();
    this.cooldownDurations = new Map();
  }

  /**
   * Starts a cooldown for an ability
   */
  startCooldown(type: AbilityType, durationMs: number, currentTime: number): void {
    this.cooldowns.set(type, currentTime);
    this.cooldownDurations.set(type, durationMs);
  }

  /**
   * Updates all cooldowns
   */
  update(deltaTime: number): void {
    // Cooldowns are managed by checking elapsed time, no need to update
  }

  /**
   * Checks if an ability is ready (cooldown complete)
   */
  isReady(type: AbilityType, currentTime: number): boolean {
    const startTime = this.cooldowns.get(type);
    if (startTime === undefined) return true;

    const duration = this.cooldownDurations.get(type) || 0;
    const elapsed = currentTime - startTime;

    return elapsed >= duration;
  }

  /**
   * Gets remaining cooldown time in milliseconds
   */
  getRemainingTime(type: AbilityType, currentTime: number): number {
    const startTime = this.cooldowns.get(type);
    if (startTime === undefined) return 0;

    const duration = this.cooldownDurations.get(type) || 0;
    const elapsed = currentTime - startTime;
    const remaining = duration - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Clears a specific cooldown
   */
  clearCooldown(type: AbilityType): void {
    this.cooldowns.delete(type);
    this.cooldownDurations.delete(type);
  }

  /**
   * Clears all cooldowns
   */
  clearAll(): void {
    this.cooldowns.clear();
    this.cooldownDurations.clear();
  }
}
