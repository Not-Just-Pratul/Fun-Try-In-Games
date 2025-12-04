import Phaser from 'phaser';
import { AbilityType } from '@game-types/ability';

export class HUD {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private abilityIcons: Map<AbilityType, Phaser.GameObjects.Container>;
  private hintButton!: Phaser.GameObjects.Container;
  private hintCooldownText!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.abilityIcons = new Map();
    this.createHUD();
  }

  private createHUD(): void {
    this.createAbilityDisplay();
    this.createHintButton();
    this.createPauseButton();
  }

  private createAbilityDisplay(): void {
    const abilities = [
      AbilityType.PHASE,
      AbilityType.POSSESS,
      AbilityType.SENSE,
      AbilityType.SPEED_BOOST
    ];

    // Background panel for abilities
    const panelBg = this.scene.add.rectangle(160, 35, 340, 90, 0x1a1a2e, 0.7);
    panelBg.setStrokeStyle(2, 0xff6400, 0.8);
    this.container.add(panelBg);

    abilities.forEach((ability, index) => {
      const x = 20 + index * 80;
      const y = 20;
      
      const abilityContainer = this.scene.add.container(x, y);
      
      // Spooky gradient background
      const bg = this.scene.add.rectangle(0, 0, 70, 70, 0x2a1a4e, 0.9);
      bg.setStrokeStyle(2, 0xff6400, 0.7);
      
      const icon = this.scene.add.text(0, -10, this.getAbilityIcon(ability), {
        fontSize: '32px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      const chargeText = this.scene.add.text(0, 20, '0', {
        fontSize: '16px',
        color: '#ffaa00',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      const cooldownOverlay = this.scene.add.rectangle(0, 0, 70, 70, 0x000000, 0);
      cooldownOverlay.setStrokeStyle(2, 0xff3333, 0);
      
      abilityContainer.add([bg, icon, chargeText, cooldownOverlay]);
      this.container.add(abilityContainer);
      
      this.abilityIcons.set(ability, abilityContainer);
    });
  }

  private createHintButton(): void {
    const x = this.scene.scale.width - 80;
    const y = 20;
    
    this.hintButton = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, 70, 70, 0x9b59b6, 0.9);
    bg.setStrokeStyle(2, 0xc77dff, 0.8);
    bg.setInteractive({ useHandCursor: true });
    
    const icon = this.scene.add.text(0, -5, '💡', {
      fontSize: '32px'
    }).setOrigin(0.5);
    
    this.hintCooldownText = this.scene.add.text(0, 25, '', {
      fontSize: '12px',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.hintButton.add([bg, icon, this.hintCooldownText]);
    this.container.add(this.hintButton);

    // Hover effect
    bg.on('pointerover', () => {
      bg.setScale(1.1);
      bg.setFillStyle(0xc77dff, 0.95);
    });

    bg.on('pointerout', () => {
      bg.setScale(1);
      bg.setFillStyle(0x9b59b6, 0.9);
    });
  }

  private createPauseButton(): void {
    const x = this.scene.scale.width - 40;
    const y = 100;
    
    this.pauseButton = this.scene.add.text(x, y, '⏸', {
      fontSize: '36px',
      color: '#ff6400'
    }).setOrigin(0.5);
    
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.on('pointerover', () => {
      this.pauseButton.setScale(1.2);
      this.pauseButton.setTint(0xffaa00);
    });
    this.pauseButton.on('pointerout', () => {
      this.pauseButton.setScale(1);
      this.pauseButton.clearTint();
    });
    this.pauseButton.on('pointerdown', () => this.onPauseClicked());
    
    this.container.add(this.pauseButton);
  }

  private getAbilityIcon(ability: AbilityType): string {
    const icons = {
      [AbilityType.PHASE]: '👻',
      [AbilityType.POSSESS]: '🎭',
      [AbilityType.SENSE]: '👁',
      [AbilityType.SPEED_BOOST]: '⚡'
    };
    return icons[ability] || '?';
  }

  public updateAbility(ability: AbilityType, charges: number, cooldown: number): void {
    const container = this.abilityIcons.get(ability);
    if (!container) return;

    const chargeText = container.getAt(2) as Phaser.GameObjects.Text;
    const cooldownOverlay = container.getAt(3) as Phaser.GameObjects.Rectangle;
    
    chargeText.setText(charges.toString());
    
    if (cooldown > 0) {
      const alpha = Math.min(0.7, cooldown / 10);
      cooldownOverlay.setAlpha(alpha);
      cooldownOverlay.setStrokeStyle(2, 0xff3333, 0.8);
    } else {
      cooldownOverlay.setAlpha(0);
      cooldownOverlay.setStrokeStyle(2, 0xff3333, 0);
    }
  }

  public updateHintButton(available: boolean, cooldown: number): void {
    const bg = this.hintButton.getAt(0) as Phaser.GameObjects.Rectangle;
    
    if (available) {
      bg.setFillStyle(0x9b59b6, 0.9);
      bg.setStrokeStyle(2, 0xc77dff, 0.8);
      bg.setInteractive({ useHandCursor: true });
      this.hintCooldownText.setText('');
    } else {
      bg.setFillStyle(0x444444, 0.6);
      bg.setStrokeStyle(2, 0x666666, 0.5);
      bg.disableInteractive();
      if (cooldown > 0) {
        this.hintCooldownText.setText(`${Math.ceil(cooldown)}s`);
      }
    }
  }

  public onHintClicked(callback: () => void): void {
    const bg = this.hintButton.getAt(0) as Phaser.GameObjects.Rectangle;
    bg.on('pointerdown', callback);
  }

  public onPauseClicked(callback?: () => void): void {
    if (callback) {
      this.pauseButton.on('pointerdown', callback);
    } else {
      this.scene.scene.pause();
      this.scene.scene.launch('PauseMenu');
    }
  }

  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  public destroy(): void {
    this.container.destroy();
  }
}
