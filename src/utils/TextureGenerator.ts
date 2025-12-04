import Phaser from 'phaser';

/**
 * TextureGenerator - Generates procedural textures for particles and effects
 */
export class TextureGenerator {
  /**
   * Generates a particle texture
   */
  public static generateParticleTexture(scene: Phaser.Scene): void {
    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    
    // Create circular particle
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    
    // Generate gradient
    graphics.fillStyle(0xffffff, 0.5);
    graphics.fillCircle(8, 8, 6);
    
    graphics.generateTexture('particle', 16, 16);
    graphics.destroy();
  }

  /**
   * Generates glow texture
   */
  public static generateGlowTexture(scene: Phaser.Scene): void {
    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    
    // Outer glow
    graphics.fillStyle(0xffffff, 0.2);
    graphics.fillCircle(32, 32, 32);
    
    // Middle glow
    graphics.fillStyle(0xffffff, 0.5);
    graphics.fillCircle(32, 32, 20);
    
    // Inner glow
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(32, 32, 10);
    
    graphics.generateTexture('glow', 64, 64);
    graphics.destroy();
  }

  /**
   * Generates sparkle texture
   */
  public static generateSparkleTexture(scene: Phaser.Scene): void {
    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    
    graphics.fillStyle(0xffffff, 1);
    
    // Create star shape
    const points = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const radius = i % 2 === 0 ? 8 : 4;
      points.push({
        x: 8 + Math.cos(angle) * radius,
        y: 8 + Math.sin(angle) * radius
      });
    }
    
    graphics.fillPoints(points, true);
    
    graphics.generateTexture('sparkle', 16, 16);
    graphics.destroy();
  }

  /**
   * Generates all textures
   */
  public static generateAllTextures(scene: Phaser.Scene): void {
    this.generateParticleTexture(scene);
    this.generateGlowTexture(scene);
    this.generateSparkleTexture(scene);
  }
}
