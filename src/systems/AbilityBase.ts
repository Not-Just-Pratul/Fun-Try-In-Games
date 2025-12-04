import { AbilityType } from '@game-types/ability';

/**
 * Base class for all abilities
 */
export abstract class AbilityBase {
  protected charges: number;
  protected maxCharges: number;
  protected cooldownMs: number;
  protected lastUsedTime: number;
  protected isActive: boolean;
  protected durationMs: number;
  protected activatedTime: number;

  constructor(maxCharges: number, cooldownMs: number, durationMs: number = 0) {
    this.charges = maxCharges;
    this.maxCharges = maxCharges;
    this.cooldownMs = cooldownMs;
    this.durationMs = durationMs;
    this.lastUsedTime = 0;
    this.isActive = false;
    this.activatedTime = 0;
  }

  /**
   * Attempts to activate the ability
   */
  activate(currentTime: number): boolean {
    if (!this.canUse(currentTime)) {
      return false;
    }

    this.charges--;
    this.lastUsedTime = currentTime;
    this.isActive = true;
    this.activatedTime = currentTime;

    this.onActivate();
    return true;
  }

  /**
   * Deactivates the ability
   */
  deactivate(): void {
    this.isActive = false;
    this.onDeactivate();
  }

  /**
   * Checks if the ability can be used
   */
  canUse(currentTime: number): boolean {
    // Must have charges
    return this.charges > 0;
  }

  /**
   * Adds a charge to the ability
   */
  addCharge(): void {
    if (this.charges < this.maxCharges) {
      this.charges++;
    }
  }

  /**
   * Updates the ability state
   */
  update(currentTime: number): void {
    // Check if duration-based ability should deactivate
    if (this.isActive && this.durationMs > 0) {
      const activeTime = currentTime - this.activatedTime;
      if (activeTime >= this.durationMs) {
        this.deactivate();
      }
    }

    // Restore charges if cooldown complete and not at max
    // Check if ability has been used (charges < max) and enough time has passed
    if (this.charges < this.maxCharges) {
      const timeSinceLastUse = currentTime - this.lastUsedTime;
      // Calculate how many full cooldown cycles have passed
      const cyclesCompleted = Math.floor(timeSinceLastUse / this.cooldownMs);
      
      if (cyclesCompleted > 0) {
        // Restore charges (but don't exceed max)
        const chargesToRestore = Math.min(cyclesCompleted, this.maxCharges - this.charges);
        this.charges += chargesToRestore;
        
        // Update last used time to account for restored charges
        this.lastUsedTime += cyclesCompleted * this.cooldownMs;
      }
    }
  }

  /**
   * Gets current charges
   */
  getCharges(): number {
    return this.charges;
  }

  /**
   * Gets max charges
   */
  getMaxCharges(): number {
    return this.maxCharges;
  }

  /**
   * Gets remaining cooldown time
   */
  getRemainingCooldown(currentTime: number): number {
    const timeSinceLastUse = currentTime - this.lastUsedTime;
    const remaining = this.cooldownMs - timeSinceLastUse;
    return Math.max(0, remaining);
  }

  /**
   * Checks if ability is currently active
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Abstract method called when ability is activated
   */
  protected abstract onActivate(): void;

  /**
   * Abstract method called when ability is deactivated
   */
  protected abstract onDeactivate(): void;

  /**
   * Gets the ability type
   */
  abstract getType(): AbilityType;
}
