import Phaser from 'phaser';
import { Vector2D } from '@game-types/common';

/**
 * SpriteRenderer - Manages sprite rendering and animations
 */
export class SpriteRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Creates ghost sprite with hover animation
   */
  public createGhostSprite(position: Vector2D): Phaser.GameObjects.Container {
    const container = this.scene.add.container(position.x, position.y);
    
    // Ghost body
    const ghost = this.scene.add.text(0, 0, '👻', {
      fontSize: '32px'
    }).setOrigin(0.5);
    
    // Glow effect
    const glow = this.scene.add.graphics();
    glow.fillStyle(0xffffff, 0.2);
    glow.fillCircle(0, 0, 20);
    
    container.add([glow, ghost]);
    container.setDepth(100);
    
    // Hover animation
    this.scene.tweens.add({
      targets: container,
      y: position.y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    return container;
  }

  /**
   * Creates obstacle sprite
   */
  public createObstacleSprite(position: Vector2D, type: 'guard' | 'trap'): Phaser.GameObjects.Container {
    const container = this.scene.add.container(position.x, position.y);
    
    if (type === 'guard') {
      const guard = this.scene.add.text(0, 0, '👻', {
        fontSize: '28px',
        color: '#ff0000'
      }).setOrigin(0.5);
      
      const aura = this.scene.add.graphics();
      aura.lineStyle(2, 0xff0000, 0.5);
      aura.strokeCircle(0, 0, 25);
      
      container.add([aura, guard]);
      
      // Pulsing animation
      this.scene.tweens.add({
        targets: aura,
        alpha: { from: 0.3, to: 0.8 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    } else {
      const trap = this.scene.add.text(0, 0, '⚠️', {
        fontSize: '20px'
      }).setOrigin(0.5);
      
      container.add(trap);
      
      // Warning pulse
      this.scene.tweens.add({
        targets: trap,
        scale: { from: 1, to: 1.2 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }
    
    container.setDepth(60);
    return container;
  }

  /**
   * Creates collectible sprite with glow
   */
  public createCollectibleSprite(position: Vector2D, emoji: string, color: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(position.x, position.y);
    
    // Glow background
    const glow = this.scene.add.graphics();
    glow.fillStyle(color, 0.3);
    glow.fillCircle(0, 0, 18);
    
    // Item
    const item = this.scene.add.text(0, 0, emoji, {
      fontSize: '20px'
    }).setOrigin(0.5);
    
    // Sparkle effect
    const sparkle = this.scene.add.graphics();
    sparkle.lineStyle(2, color, 0.8);
    sparkle.strokeCircle(0, 0, 15);
    
    container.add([glow, sparkle, item]);
    container.setDepth(50);
    
    // Floating animation
    this.scene.tweens.add({
      targets: container,
      y: position.y - 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Rotation
    this.scene.tweens.add({
      targets: item,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    });
    
    // Sparkle pulse
    this.scene.tweens.add({
      targets: sparkle,
      alpha: { from: 0.3, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    return container;
  }

  /**
   * Creates puzzle indicator sprite
   */
  public createPuzzleSprite(position: Vector2D, type: 'collection' | 'possession'): Phaser.GameObjects.Container {
    const container = this.scene.add.container(position.x, position.y);
    
    const emoji = type === 'collection' ? '📦' : '🔒';
    const color = type === 'collection' ? 0xffaa00 : 0xff6600;
    
    const icon = this.scene.add.text(0, 0, emoji, {
      fontSize: '24px'
    }).setOrigin(0.5);
    
    const ring = this.scene.add.graphics();
    ring.lineStyle(2, color, 0.6);
    ring.strokeCircle(0, 0, 18);
    
    container.add([ring, icon]);
    container.setDepth(50);
    
    // Pulse animation
    this.scene.tweens.add({
      targets: ring,
      scaleX: { from: 1, to: 1.3 },
      scaleY: { from: 1, to: 1.3 },
      alpha: { from: 0.6, to: 0 },
      duration: 1500,
      repeat: -1
    });
    
    return container;
  }

  /**
   * Creates level transition effect
   */
  public createTransitionEffect(callback: () => void): void {
    const { width, height } = this.scene.cameras.main;
    
    // Fade to black
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    overlay.setOrigin(0);
    overlay.setDepth(300);
    
    this.scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        callback();
        
        // Fade back in
        this.scene.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 500,
          onComplete: () => overlay.destroy()
        });
      }
    });
  }

  /**
   * Creates screen shake effect
   */
  public createScreenShake(intensity: number = 0.01, duration: number = 300): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /**
   * Creates flash effect
   */
  public createFlash(color: number = 0xffffff, duration: number = 300): void {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    
    this.scene.cameras.main.flash(duration, r, g, b);
  }
}
