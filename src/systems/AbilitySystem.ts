import { AbilityType } from '@game-types/ability';
import { AbilityBase } from './AbilityBase';
import { CooldownManager } from './CooldownManager';

/**
 * Manages all abilities for the ghost character
 */
export class AbilitySystem {
  private abilities: Map<AbilityType, AbilityBase>;
  private cooldownManager: CooldownManager;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.abilities = new Map();
    this.cooldownManager = new CooldownManager();
  }

  /**
   * Registers an ability
   */
  registerAbility(ability: AbilityBase): void {
    this.abilities.set(ability.getType(), ability);
  }

  /**
   * Activates an ability
   */
  activateAbility(type: AbilityType): boolean {
    const ability = this.abilities.get(type);
    if (!ability) return false;

    const currentTime = this.scene.time.now;
    
    // Check if ability can be used
    if (!ability.canUse(currentTime)) {
      return false;
    }

    // Activate the ability
    const success = ability.activate(currentTime);
    
    if (success) {
      // Start cooldown
      this.cooldownManager.startCooldown(
        type,
        ability.getRemainingCooldown(currentTime),
        currentTime
      );

      // Emit event
      this.scene.events.emit('ability-activated', type);
    }

    return success;
  }

  /**
   * Updates all abilities
   */
  update(deltaTime: number): void {
    const currentTime = this.scene.time.now;
    
    this.abilities.forEach((ability) => {
      ability.update(currentTime);
    });

    this.cooldownManager.update(deltaTime);
  }

  /**
   * Adds a charge to an ability
   */
  addCharge(type: AbilityType): void {
    const ability = this.abilities.get(type);
    if (ability) {
      ability.addCharge();
    }
  }

  /**
   * Gets ability status
   */
  getAbilityStatus(type: AbilityType): {
    charges: number;
    maxCharges: number;
    isActive: boolean;
    remainingCooldown: number;
  } | null {
    const ability = this.abilities.get(type);
    if (!ability) return null;

    const currentTime = this.scene.time.now;

    return {
      charges: ability.getCharges(),
      maxCharges: ability.getMaxCharges(),
      isActive: ability.getIsActive(),
      remainingCooldown: ability.getRemainingCooldown(currentTime)
    };
  }

  /**
   * Gets an ability by type
   */
  getAbility(type: AbilityType): AbilityBase | undefined {
    return this.abilities.get(type);
  }

  /**
   * Checks if an ability is active
   */
  isAbilityActive(type: AbilityType): boolean {
    const ability = this.abilities.get(type);
    return ability ? ability.getIsActive() : false;
  }
}
