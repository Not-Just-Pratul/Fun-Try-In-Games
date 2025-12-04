import Phaser from 'phaser';
import { Vector2D, Direction } from '@game-types/common';
import { AbilityType } from '@game-types/ability';
import { Collectible } from '@game-types/collectible';
import { AbilitySystem } from '@systems/AbilitySystem';

/**
 * GhostCharacter - The player-controlled ghost entity
 */
export class GhostCharacter extends Phaser.GameObjects.Sprite {
  private velocity: Vector2D;
  private moveSpeed: number;
  private baseMoveSpeed: number;
  private isMoving: boolean;
  private currentDirection: Direction | null;
  private abilitySystem: AbilitySystem | null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Create a simple circle sprite for the ghost
    super(scene, x, y, '');
    
    this.velocity = { x: 0, y: 0 };
    this.baseMoveSpeed = 150; // pixels per second
    this.moveSpeed = this.baseMoveSpeed;
    this.isMoving = false;
    this.currentDirection = null;
    this.abilitySystem = null;

    // Create ghost visual
    this.createGhostGraphics();
    
    // Add to scene
    scene.add.existing(this);
    
    // Set origin to center
    this.setOrigin(0.5, 0.5);
    
    // Make ghost MUCH larger and more visible
    this.setScale(3);
    this.setDepth(100);
  }

  /**
   * Creates Kiro logo style character with cosmetic customization
   */
  private createGhostGraphics(): void {
    // Get equipped cosmetics from registry
    const equippedCosmetics = this.scene.registry.get('equippedCosmetics') || {
      skin: 'default_ghost'
    };
    
    // Get color based on equipped skin
    const skinColors = {
      'default_ghost': { main: 0x6366f1, glow: 0x818cf8, outer: 0xa5b4fc }, // Indigo/purple
      'ghost_blue': { main: 0x3b82f6, glow: 0x60a5fa, outer: 0x93c5fd },     // Blue
      'ghost_purple': { main: 0x9333ea, glow: 0xa855f7, outer: 0xc084fc }   // Purple
    };
    
    const colors = skinColors[equippedCosmetics.skin as keyof typeof skinColors] || skinColors['default_ghost'];
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    
    // Kiro logo - stylized "K" shape with modern design
    const centerX = 16;
    const centerY = 16;
    const size = 12;
    
    // Main circle background with custom color
    graphics.fillStyle(colors.main, 1);
    graphics.fillCircle(centerX, centerY, size);
    
    // Draw "K" letter in white
    graphics.fillStyle(0xffffff, 1);
    
    // Vertical line of K
    graphics.fillRect(centerX - 4, centerY - 7, 2.5, 14);
    
    // Upper diagonal of K
    graphics.save();
    graphics.translateCanvas(centerX, centerY);
    graphics.rotateCanvas(-0.5);
    graphics.fillRect(-1, -6, 2, 7);
    graphics.restore();
    
    // Lower diagonal of K
    graphics.save();
    graphics.translateCanvas(centerX, centerY);
    graphics.rotateCanvas(0.5);
    graphics.fillRect(-1, -1, 2, 7);
    graphics.restore();
    
    // Add glow effect with custom color
    graphics.lineStyle(3, colors.glow, 0.6);
    graphics.strokeCircle(centerX, centerY, size + 2);
    
    // Outer glow with custom color
    graphics.lineStyle(2, colors.outer, 0.3);
    graphics.strokeCircle(centerX, centerY, size + 4);
    
    // Generate texture from graphics with unique name - LARGER SIZE
    const textureName = `ghost_${equippedCosmetics.skin}`;
    graphics.generateTexture(textureName, 64, 64);
    graphics.destroy();
    
    // Set the texture
    this.setTexture(textureName);
  }

  /**
   * Moves the ghost in the specified direction
   */
  move(direction: Direction): void {
    this.currentDirection = direction;
    this.isMoving = true;

    switch (direction) {
      case Direction.NORTH:
        this.velocity = { x: 0, y: -1 };
        break;
      case Direction.SOUTH:
        this.velocity = { x: 0, y: 1 };
        break;
      case Direction.EAST:
        this.velocity = { x: 1, y: 0 };
        break;
      case Direction.WEST:
        this.velocity = { x: -1, y: 0 };
        break;
    }
  }

  /**
   * Stops the ghost movement
   */
  stopMovement(): void {
    this.isMoving = false;
    this.velocity = { x: 0, y: 0 };
    this.currentDirection = null;
  }

  /**
   * Updates the ghost position based on velocity
   */
  update(deltaTime: number): void {
    // Update ability system
    if (this.abilitySystem) {
      this.abilitySystem.update(deltaTime);
    }

    // Update move speed based on active abilities
    this.moveSpeed = this.getMoveSpeed();

    if (this.isMoving) {
      const deltaSeconds = deltaTime / 1000;
      const moveX = this.velocity.x * this.moveSpeed * deltaSeconds;
      const moveY = this.velocity.y * this.moveSpeed * deltaSeconds;
      
      this.x += moveX;
      this.y += moveY;
      
      // Add subtle floating animation
      const floatOffset = Math.sin(this.scene.time.now / 300) * 2;
      this.y += floatOffset * deltaSeconds;
    }
  }

  /**
   * Gets the current position as Vector2D
   */
  getPosition(): Vector2D {
    return { x: this.x, y: this.y };
  }

  /**
   * Sets the position
   */
  setPosition(x: number, y: number): this {
    super.setPosition(x, y);
    return this;
  }

  /**
   * Resets the ghost to a position
   */
  reset(x: number, y: number): void {
    this.setPosition(x, y);
    this.stopMovement();
  }

  /**
   * Checks if the ghost is currently moving
   */
  getIsMoving(): boolean {
    return this.isMoving;
  }

  /**
   * Gets the current direction
   */
  getCurrentDirection(): Direction | null {
    return this.currentDirection;
  }

  /**
   * Collects an item
   */
  collectItem(item: Collectible): void {
    // Emit event for collection
    this.scene.events.emit('item-collected', item);
  }

  /**
   * Sets the ability system
   */
  setAbilitySystem(abilitySystem: AbilitySystem): void {
    this.abilitySystem = abilitySystem;
  }

  /**
   * Uses an ability
   */
  useAbility(abilityType: AbilityType): boolean {
    if (!this.abilitySystem) {
      return false;
    }

    const success = this.abilitySystem.activateAbility(abilityType);
    
    if (success) {
      // Apply ability effects
      this.applyAbilityEffect(abilityType);
      
      // Emit event for ability usage
      this.scene.events.emit('ability-used', abilityType);
    }
    
    return success;
  }

  /**
   * Applies ability-specific effects
   */
  private applyAbilityEffect(abilityType: AbilityType): void {
    switch (abilityType) {
      case AbilityType.SPEED_BOOST:
        // Speed boost is handled in update loop
        break;
      case AbilityType.PHASE:
        // Phase ability effect is handled by collision detection
        break;
      case AbilityType.SENSE:
        // Sense ability effect is handled by maze rendering
        break;
      case AbilityType.POSSESS:
        // Possession is handled by puzzle system
        break;
    }
  }

  /**
   * Gets the current move speed (accounting for speed boost)
   */
  getMoveSpeed(): number {
    if (this.abilitySystem && this.abilitySystem.isAbilityActive(AbilityType.SPEED_BOOST)) {
      const ability = this.abilitySystem.getAbility(AbilityType.SPEED_BOOST);
      if (ability && 'getSpeedMultiplier' in ability) {
        return this.baseMoveSpeed * (ability as any).getSpeedMultiplier();
      }
    }
    return this.baseMoveSpeed;
  }

  /**
   * Checks if phase ability is active
   */
  isPhaseActive(): boolean {
    return this.abilitySystem ? this.abilitySystem.isAbilityActive(AbilityType.PHASE) : false;
  }

  /**
   * Checks if sense ability is active
   */
  isSenseActive(): boolean {
    return this.abilitySystem ? this.abilitySystem.isAbilityActive(AbilityType.SENSE) : false;
  }

  /**
   * Gets the ability system
   */
  getAbilitySystem(): AbilitySystem | null {
    return this.abilitySystem;
  }

  /**
   * Updates the ghost appearance based on equipped cosmetics
   */
  updateCosmetics(): void {
    // Recreate the ghost graphics with new cosmetics
    this.createGhostGraphics();
  }
}
