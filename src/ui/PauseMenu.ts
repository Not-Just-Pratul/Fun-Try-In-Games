import Phaser from 'phaser';

export class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseMenu' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0);
    overlay.setInteractive();

    // Menu container
    const menuBg = this.add.rectangle(width / 2, height / 2, 400, 500, 0x2a2a3e, 0.95);
    menuBg.setStrokeStyle(3, 0x6b6b8f);

    // Title
    this.add.text(width / 2, height / 2 - 180, 'PAUSED', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Resume Button
    this.createButton(width / 2, height / 2 - 80, 'RESUME', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    }, 0x2ecc71);

    // Restart Button
    this.createButton(width / 2, height / 2, 'RESTART', () => {
      this.scene.stop();
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    }, 0xe67e22);

    // Settings Button
    this.createButton(width / 2, height / 2 + 80, 'SETTINGS', () => {
      this.scene.pause();
      this.scene.launch('Settings', { from: 'PauseMenu' });
    }, 0x3498db);

    // Main Menu Button
    this.createButton(width / 2, height / 2 + 160, 'MAIN MENU', () => {
      this.scene.stop();
      this.scene.stop('GameScene');
      this.scene.start('MainMenu');
    }, 0xe74c3c);
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    color: number
  ): void {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 300, 60, color, 0.9);
    bg.setStrokeStyle(2, 0xffffff, 0.5);

    const label = this.add.text(0, 0, text, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    button.add([bg, label]);
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => bg.setScale(1.05));
    bg.on('pointerout', () => bg.setScale(1));
    bg.on('pointerdown', callback);
  }
}
