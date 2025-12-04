import Phaser from 'phaser';
import { Vector2D } from '@game-types/common';

/**
 * LightingSystem - Manages lighting effects for shadow mazes
 */
export class LightingSystem {
  private scene: Phaser.Scene;
  private lightMask?: Phaser.GameObjects.Graphics;
  private lightRadius: number = 100;
  private ambientDarkness: number = 0.7;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Enables shadow maze lighting
   */
  public enableShadowMode(radius: number = 100): void {
    this.lightRadius = radius;
    
    // Create darkness overlay
    this.lightMask = this.scene.add.graphics();
    this.lightMask.setDepth(200);
    
    this.updateLighting({ x: 0, y: 0 });
  }

  /**
   * Updates lighting position (follows player)
   */
  public updateLighting(position: Vector2D): void {
    if (!this.lightMask) return;

    const { width, height } = this.scene.cameras.main;
    
    this.lightMask.clear();
    
    // Draw darkness overlay
    this.lightMask.fillStyle(0x000000, this.ambientDarkness);
    this.lightMask.fillRect(0, 0, width, height);
    
    // Create light circle around player
    this.lightMask.fillStyle(0x000000, 0);
    this.lightMask.fillCircle(position.x, position.y, this.lightRadius);
    
    // Blend mode for proper masking
    this.lightMask.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  /**
   * Disables shadow mode
   */
  public disableShadowMode(): void {
    if (this.lightMask) {
      this.lightMask.destroy();
      this.lightMask = undefined;
    }
  }

  /**
   * Sets light radius
   */
  public setLightRadius(radius: number): void {
    this.lightRadius = radius;
  }

  /**
   * Sets ambient darkness level
   */
  public setAmbientDarkness(darkness: number): void {
    this.ambientDarkness = Phaser.Math.Clamp(darkness, 0, 1);
  }

  /**
   * Creates flickering torch effect
   */
  public createTorchEffect(position: Vector2D): Phaser.GameObjects.Light {
    const light = this.scene.lights.addLight(position.x, position.y, 150, 0xff9944, 1);
    
    // Flicker animation
    this.scene.tweens.add({
      targets: light,
      intensity: { from: 0.8, to: 1.2 },
      radius: { from: 140, to: 160 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return light;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.disableShadowMode();
  }
}
