import Phaser from 'phaser';

/**
 * AnimationManager - Creates and manages sprite animations
 */
export class AnimationManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Creates ghost movement animations
   */
  public createGhostAnimations(): void {
    // Idle animation
    this.scene.anims.create({
      key: 'ghost-idle',
      frames: [{ key: 'ghost', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });

    // Move animation
    this.scene.anims.create({
      key: 'ghost-move',
      frames: [{ key: 'ghost', frame: 0 }],
      frameRate: 8,
      repeat: -1
    });

    // Phase animation
    this.scene.anims.create({
      key: 'ghost-phase',
      frames: [{ key: 'ghost', frame: 0 }],
      frameRate: 12,
      repeat: -1
    });
  }

  /**
   * Creates collectible animations
   */
  public createCollectibleAnimations(): void {
    this.scene.anims.create({
      key: 'collectible-idle',
      frames: [{ key: 'collectible', frame: 0 }],
      frameRate: 6,
      repeat: -1
    });

    this.scene.anims.create({
      key: 'collectible-collect',
      frames: [{ key: 'collectible', frame: 0 }],
      frameRate: 12,
      repeat: 0
    });
  }

  /**
   * Creates obstacle animations
   */
  public createObstacleAnimations(): void {
    // Guard patrol
    this.scene.anims.create({
      key: 'guard-patrol',
      frames: [{ key: 'guard', frame: 0 }],
      frameRate: 4,
      repeat: -1
    });

    // Guard alert
    this.scene.anims.create({
      key: 'guard-alert',
      frames: [{ key: 'guard', frame: 0 }],
      frameRate: 8,
      repeat: -1
    });

    // Trap idle
    this.scene.anims.create({
      key: 'trap-idle',
      frames: [{ key: 'trap', frame: 0 }],
      frameRate: 2,
      repeat: -1
    });

    // Trap triggered
    this.scene.anims.create({
      key: 'trap-triggered',
      frames: [{ key: 'trap', frame: 0 }],
      frameRate: 10,
      repeat: 0
    });
  }

  /**
   * Creates UI animations
   */
  public createUIAnimations(): void {
    // Button hover
    this.scene.anims.create({
      key: 'button-hover',
      frames: [{ key: 'button', frame: 0 }],
      frameRate: 1,
      repeat: 0
    });

    // Ability ready
    this.scene.anims.create({
      key: 'ability-ready',
      frames: [{ key: 'ability', frame: 0 }],
      frameRate: 6,
      repeat: -1
    });
  }

  /**
   * Plays animation on sprite
   */
  public playAnimation(sprite: Phaser.GameObjects.Sprite, key: string): void {
    if (sprite && this.scene.anims.exists(key)) {
      sprite.play(key);
    }
  }

  /**
   * Stops animation on sprite
   */
  public stopAnimation(sprite: Phaser.GameObjects.Sprite): void {
    if (sprite) {
      sprite.stop();
    }
  }
}
