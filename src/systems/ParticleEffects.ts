import Phaser from 'phaser';
import { AbilityType } from '@game-types/ability';
import { Vector2D } from '@game-types/common';

/**
 * ParticleEffects - Manages particle effects for abilities and events
 */
export class ParticleEffects {
  private scene: Phaser.Scene;
  private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.emitters = new Map();
  }

  /**
   * Creates ability activation particle effect
   */
  public createAbilityEffect(ability: AbilityType, position: Vector2D): void {
    const config = this.getAbilityEffectConfig(ability);
    
    const particles = this.scene.add.particles(position.x, position.y, config.texture, {
      speed: { min: config.speed.min, max: config.speed.max },
      scale: { start: config.scale.start, end: config.scale.end },
      alpha: { start: config.alpha.start, end: config.alpha.end },
      lifespan: config.lifespan,
      blendMode: 'ADD',
      tint: config.tint,
      quantity: config.quantity,
      frequency: config.frequency
    });

    particles.setDepth(150);

    // Auto-destroy after duration
    this.scene.time.delayedCall(config.duration, () => {
      particles.destroy();
    });
  }

  /**
   * Creates collectible pickup effect
   */
  public createCollectEffect(position: Vector2D, color: number): void {
    const particles = this.scene.add.particles(position.x, position.y, 'particle', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      blendMode: 'ADD',
      tint: color,
      quantity: 15,
      angle: { min: 0, max: 360 }
    });

    particles.setDepth(150);

    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }

  /**
   * Creates explosion effect
   */
  public createExplosion(position: Vector2D, color: number = 0xff6600): void {
    const particles = this.scene.add.particles(position.x, position.y, 'particle', {
      speed: { min: 100, max: 300 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      blendMode: 'ADD',
      tint: color,
      quantity: 30,
      angle: { min: 0, max: 360 }
    });

    particles.setDepth(150);

    this.scene.time.delayedCall(800, () => {
      particles.destroy();
    });
  }

  /**
   * Creates trail effect for movement
   */
  public createTrail(position: Vector2D, color: number = 0x9966ff): Phaser.GameObjects.Particles.ParticleEmitter {
    const emitter = this.scene.add.particles(position.x, position.y, 'particle', {
      speed: 20,
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 400,
      blendMode: 'ADD',
      tint: color,
      frequency: 50
    });

    emitter.setDepth(40);
    return emitter;
  }

  /**
   * Gets ability-specific effect configuration
   */
  private getAbilityEffectConfig(ability: AbilityType): any {
    const configs = {
      [AbilityType.PHASE]: {
        texture: 'particle',
        speed: { min: 50, max: 100 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 1000,
        tint: 0x9966ff,
        quantity: 20,
        frequency: 50,
        duration: 2000
      },
      [AbilityType.POSSESS]: {
        texture: 'particle',
        speed: { min: 80, max: 150 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        tint: 0xff6600,
        quantity: 25,
        frequency: 40,
        duration: 1500
      },
      [AbilityType.SENSE]: {
        texture: 'particle',
        speed: { min: 30, max: 80 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 1200,
        tint: 0x00ff00,
        quantity: 15,
        frequency: 60,
        duration: 2500
      },
      [AbilityType.SPEED_BOOST]: {
        texture: 'particle',
        speed: { min: 100, max: 200 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 600,
        tint: 0xffaa00,
        quantity: 30,
        frequency: 30,
        duration: 1000
      }
    };

    return configs[ability];
  }

  /**
   * Cleanup all effects
   */
  public destroy(): void {
    this.emitters.forEach(emitter => emitter.destroy());
    this.emitters.clear();
  }
}
