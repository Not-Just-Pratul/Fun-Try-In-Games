import Phaser from 'phaser';
import { LocalStorageManager } from '../utils/LocalStorageManager';

export class SettingsScene extends Phaser.Scene {
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;
  private voiceVolume: number = 0.9;
  private highContrast: boolean = false;
  private callingScene?: string;

  constructor() {
    super({ key: 'Settings' });
  }

  init(data?: { from?: string }): void {
    this.callingScene = data?.from;
  }

  create(): void {
    const { width, height } = this.scale;

    // Background overlay - make it clickable to prevent clicks going through
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0);
    overlay.setInteractive();

    // Panel
    const panel = this.add.rectangle(width / 2, height / 2, 500, 600, 0x2a2a3e, 0.95);
    panel.setStrokeStyle(3, 0x6b6b8f);

    // Title
    this.add.text(width / 2, height / 2 - 250, 'SETTINGS', {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Volume sliders
    this.createVolumeSlider(width / 2, height / 2 - 150, 'Music', this.musicVolume, (val) => {
      this.musicVolume = val;
    });
    this.createVolumeSlider(width / 2, height / 2 - 50, 'SFX', this.sfxVolume, (val) => {
      this.sfxVolume = val;
    });
    this.createVolumeSlider(width / 2, height / 2 + 50, 'Voice', this.voiceVolume, (val) => {
      this.voiceVolume = val;
    });

    // Accessibility options
    this.createToggle(width / 2, height / 2 + 150, 'High Contrast', this.highContrast, (val) => {
      this.highContrast = val;
    });

    // Clear save data button
    this.createClearDataButton(width / 2, height / 2 + 200);

    // Close button
    this.createCloseButton(width / 2, height / 2 + 250);

    // ESC key to close
    this.input.keyboard?.once('keydown-ESC', () => {
      this.closeSettings();
    });
  }

  private createVolumeSlider(
    x: number, 
    y: number, 
    label: string, 
    value: number,
    onChange: (value: number) => void
  ): void {
    // Label
    this.add.text(x - 180, y, label, {
      fontSize: '20px',
      color: '#ffffff'
    });

    // Slider background
    const sliderBg = this.add.rectangle(x + 50, y, 200, 10, 0x555555);
    sliderBg.setInteractive({ useHandCursor: true });

    // Slider fill
    const sliderFill = this.add.rectangle(x + 50 - 100, y, value * 200, 10, 0x3498db);
    sliderFill.setOrigin(0, 0.5);

    // Value text
    const valueText = this.add.text(x + 160, y, `${Math.round(value * 100)}%`, {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    // Make slider interactive
    sliderBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.updateSlider(pointer, sliderBg, sliderFill, valueText, onChange);
    });

    sliderBg.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.updateSlider(pointer, sliderBg, sliderFill, valueText, onChange);
      }
    });
  }

  private updateSlider(
    pointer: Phaser.Input.Pointer,
    bg: Phaser.GameObjects.Rectangle,
    fill: Phaser.GameObjects.Rectangle,
    text: Phaser.GameObjects.Text,
    onChange: (value: number) => void
  ): void {
    const localX = pointer.x - (bg.x - bg.width / 2);
    const value = Phaser.Math.Clamp(localX / bg.width, 0, 1);
    
    fill.width = value * bg.width;
    text.setText(`${Math.round(value * 100)}%`);
    onChange(value);
  }

  private createToggle(
    x: number, 
    y: number, 
    label: string, 
    initialValue: boolean,
    onChange: (value: boolean) => void
  ): void {
    // Label
    this.add.text(x - 180, y, label, {
      fontSize: '20px',
      color: '#ffffff'
    });

    // Toggle background
    const toggleBg = this.add.rectangle(x + 100, y, 60, 30, 0x555555, 0.9);
    toggleBg.setStrokeStyle(2, 0xffffff);

    // Toggle knob
    const knobX = initialValue ? x + 115 : x + 85;
    const knob = this.add.circle(knobX, y, 12, 0xffffff);

    // State
    let isOn = initialValue;
    if (isOn) {
      toggleBg.setFillStyle(0x2ecc71, 0.9);
    }

    // Make interactive
    toggleBg.setInteractive({ useHandCursor: true });
    toggleBg.on('pointerdown', () => {
      isOn = !isOn;
      
      // Update visuals
      toggleBg.setFillStyle(isOn ? 0x2ecc71 : 0x555555, 0.9);
      
      // Animate knob
      this.tweens.add({
        targets: knob,
        x: isOn ? x + 115 : x + 85,
        duration: 200,
        ease: 'Cubic.easeOut'
      });

      // Callback
      onChange(isOn);
    });
  }

  private createCloseButton(x: number, y: number): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 200, 50, 0xe74c3c, 0.9);
    bg.setStrokeStyle(2, 0xffffff);

    const text = this.add.text(0, 0, 'CLOSE', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);

    bg.setInteractive({ useHandCursor: true });
    
    bg.on('pointerover', () => {
      bg.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setScale(1);
    });

    bg.on('pointerdown', () => {
      this.closeSettings();
    });
  }

  private createClearDataButton(x: number, y: number): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 250, 40, 0xff6600, 0.9);
    bg.setStrokeStyle(2, 0xffffff);

    const text = this.add.text(0, 0, '🗑️ Clear Save Data', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);

    bg.setInteractive({ useHandCursor: true });
    
    bg.on('pointerover', () => {
      bg.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setScale(1);
    });

    bg.on('pointerdown', () => {
      // Confirm before clearing
      const confirmText = this.add.text(x, y - 60, 'Are you sure? This will reset everything!\nClick again to confirm.', {
        fontSize: '16px',
        color: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
        align: 'center'
      }).setOrigin(0.5).setDepth(300);

      // Change button to confirm
      text.setText('⚠️ CONFIRM RESET');
      bg.setFillStyle(0xff0000, 0.9);

      // One-time confirm handler
      bg.once('pointerdown', () => {
        LocalStorageManager.clearSaveData();
        
        // Reset registry to defaults
        LocalStorageManager.loadFromLocalStorage(this.registry);
        
        // Show success message
        const successText = this.add.text(x, y - 60, '✅ Save data cleared!\nRestarting game...', {
          fontSize: '18px',
          color: '#00ff00',
          backgroundColor: '#000000',
          padding: { x: 10, y: 5 },
          align: 'center'
        }).setOrigin(0.5).setDepth(300);

        // Restart game after 2 seconds
        this.time.delayedCall(2000, () => {
          window.location.reload();
        });
      });

      // Cancel after 5 seconds
      this.time.delayedCall(5000, () => {
        if (confirmText.active) {
          confirmText.destroy();
          text.setText('🗑️ Clear Save Data');
          bg.setFillStyle(0xff6600, 0.9);
        }
      });
    });
  }

  private closeSettings(): void {
    // Stop this scene
    this.scene.stop();

    // Resume the calling scene if it was paused
    if (this.callingScene) {
      const callingScene = this.scene.get(this.callingScene);
      if (callingScene && callingScene.scene.isPaused()) {
        this.scene.resume(this.callingScene);
      }
    } else {
      // Check if PauseMenu is active
      const pauseMenu = this.scene.get('PauseMenu');
      if (pauseMenu && pauseMenu.scene.isActive()) {
        this.scene.resume('PauseMenu');
      }
    }
  }
}
