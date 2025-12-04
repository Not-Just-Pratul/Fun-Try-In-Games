import Phaser from 'phaser';
import { CollectibleType } from '@game-types/collectible';
import { Vector2D } from '@game-types/common';

/**
 * CollectionFeedback - Provides visual and audio feedback for collectible pickup
 */
export class CollectionFeedback {
  private scene: Phaser.Scene;
  private sounds: Map<CollectibleType, Phaser.Sound.BaseSound>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sounds = new Map();
    this.initializeSounds();
  }

  /**
   * Initializes sound effects for different collectible types
   */
  private initializeSounds(): void {
    // In a real implementation, these would load actual audio files
    // For now, we'll use placeholder references
    // this.sounds.set(CollectibleType.CLUE, this.scene.sound.add('clue-collect'));
    // this.sounds.set(CollectibleType.LORE_ITEM, this.scene.sound.add('lore-collect'));
    // this.sounds.set(CollectibleType.ABILITY_CHARGE, this.scene.sound.add('charge-collect'));
    // this.sounds.set(CollectibleType.COSMETIC_UNLOCK, this.scene.sound.add('cosmetic-collect'));
  }

  /**
   * Plays collection feedback for a collectible
   */
  playCollectionFeedback(type: CollectibleType, position: Vector2D): void {
    this.playVisualFeedback(type, position);
    this.playAudioFeedback(type);
  }

  /**
   * Plays visual feedback (particle effects, animations)
   */
  private playVisualFeedback(type: CollectibleType, position: Vector2D): void {
    // Create particle effect
    const color = this.getColorForType(type);
    
    // Create a simple particle burst using graphics
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      const speed = 50 + Math.random() * 100;
      const particle = this.scene.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(position.x, position.y);
      particle.setDepth(100);
      
      // Animate particle
      this.scene.tweens.add({
        targets: particle,
        x: position.x + Math.cos(angle) * speed,
        y: position.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }

    // Create floating text
    this.createFloatingText(type, position);
  }

  /**
   * Creates floating text feedback
   */
  private createFloatingText(type: CollectibleType, position: Vector2D): void {
    const text = this.getTextForType(type);
    const color = this.getColorHexForType(type);

    const floatingText = this.scene.add.text(position.x, position.y, text, {
      fontSize: '16px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });

    floatingText.setOrigin(0.5, 0.5);

    // Animate floating text
    this.scene.tweens.add({
      targets: floatingText,
      y: position.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }

  /**
   * Plays audio feedback
   */
  private playAudioFeedback(type: CollectibleType): void {
    const sound = this.sounds.get(type);
    if (sound) {
      sound.play();
    }
  }

  /**
   * Gets the color for a collectible type
   */
  private getColorForType(type: CollectibleType): number {
    switch (type) {
      case CollectibleType.CLUE:
        return 0xffff00; // Yellow
      case CollectibleType.LORE_ITEM:
        return 0x9370db; // Purple
      case CollectibleType.ABILITY_CHARGE:
        return 0x00ffff; // Cyan
      case CollectibleType.COSMETIC_UNLOCK:
        return 0xff69b4; // Pink
      default:
        return 0xffffff; // White
    }
  }

  /**
   * Gets the hex color string for a collectible type
   */
  private getColorHexForType(type: CollectibleType): string {
    switch (type) {
      case CollectibleType.CLUE:
        return '#ffff00';
      case CollectibleType.LORE_ITEM:
        return '#9370db';
      case CollectibleType.ABILITY_CHARGE:
        return '#00ffff';
      case CollectibleType.COSMETIC_UNLOCK:
        return '#ff69b4';
      default:
        return '#ffffff';
    }
  }

  /**
   * Gets the text for a collectible type
   */
  private getTextForType(type: CollectibleType): string {
    switch (type) {
      case CollectibleType.CLUE:
        return 'Clue Found!';
      case CollectibleType.LORE_ITEM:
        return 'Lore Discovered!';
      case CollectibleType.ABILITY_CHARGE:
        return 'Charge +1';
      case CollectibleType.COSMETIC_UNLOCK:
        return 'Cosmetic Unlocked!';
      default:
        return 'Item Collected!';
    }
  }

  /**
   * Cleans up resources
   */
  destroy(): void {
    this.sounds.clear();
  }
}
