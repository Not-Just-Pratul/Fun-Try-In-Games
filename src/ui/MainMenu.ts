import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Spooky gradient background
    const gradient = this.make.graphics({ x: 0, y: 0 }, false);
    gradient.fillGradientStyle(0x0a0a15, 0x0a0a15, 0x1a0a2e, 0x16213e, 1);
    gradient.fillRect(0, 0, width, height);
    gradient.generateTexture('bgGradient', width, height);
    gradient.destroy();
    this.add.image(0, 0, 'bgGradient').setOrigin(0);

    // Decorative fog effect
    const fog = this.add.rectangle(width / 2, height / 2, width, height, 0x2a1a4e, 0.3);
    this.tweens.add({
      targets: fog,
      alpha: 0.1,
      duration: 3000,
      yoyo: true,
      repeat: -1
    });

    // Kiroween Badge
    this.add.text(width / 2, height * 0.08, '🎃 KIROWEEN 👻', {
      fontSize: '20px',
      color: '#ff6400',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Main Title with glow effect
    const titleShadow = this.add.text(width / 2 + 2, height * 0.22 + 2, 'PHANTOM MAZE', {
      fontSize: '72px',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.5);

    const title = this.add.text(width / 2, height * 0.2, 'PHANTOM MAZE', {
      fontSize: '72px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff6400',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Pulsing glow animation
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // Subtitle with spooky flavor
    this.add.text(width / 2, height * 0.32, 'Escape the Ethereal Labyrinth', {
      fontSize: '22px',
      color: '#ff9933',
      fontStyle: 'italic',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.37, 'Built with Kiro\'s Dark Magic ✨', {
      fontSize: '14px',
      color: '#9966ff',
      align: 'center'
    }).setOrigin(0.5);

    // Play Button
    this.createButton(width / 2, height * 0.5, '▶ PLAY', () => {
      this.scene.start('LevelSelect');
    }, 0xff6400, 0xffaa00);

    // Continue Button
    this.createButton(width / 2, height * 0.6, '⟳ CONTINUE', () => {
      this.scene.start('GameScene');
    }, 0x4a90e2, 0x6ab0ff);

    // Customization Button
    this.createButton(width / 2, height * 0.7, '🎭 CUSTOMIZE', () => {
      this.scene.start('Customization');
    }, 0x9b59b6, 0xc77dff);

    // Shop Button
    this.createButton(width / 2, height * 0.8, '🛍 SHOP', () => {
      this.scene.start('Shop');
    }, 0xe67e22, 0xff9944);

    // Settings Button (top right)
    const settingsBtn = this.add.text(width - 50, 40, '⚙', {
      fontSize: '44px',
      color: '#ff6400'
    }).setOrigin(0.5);
    
    settingsBtn.setInteractive({ useHandCursor: true });
    settingsBtn.on('pointerover', () => {
      settingsBtn.setScale(1.2);
      settingsBtn.setTint(0xffaa00);
    });
    settingsBtn.on('pointerout', () => {
      settingsBtn.setScale(1);
      settingsBtn.clearTint();
    });
    settingsBtn.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('Settings', { from: 'MainMenu' });
    });

    // Footer
    this.add.text(width / 2, height - 20, 'Summon your ideas. Git commit to the darkness. 🌙', {
      fontSize: '12px',
      color: '#666666',
      align: 'center'
    }).setOrigin(0.5);
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    baseColor: number = 0xff6400,
    hoverColor: number = 0xffaa00
  ): void {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 320, 70, baseColor, 0.85);
    bg.setStrokeStyle(3, 0xffffff, 0.6);

    const label = this.add.text(0, 0, text, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(320, 70);
    bg.setInteractive({ useHandCursor: true });

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(hoverColor, 0.95);
      bg.setScale(1.08);
      this.tweens.add({
        targets: bg,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 200
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(baseColor, 0.85);
      bg.setScale(1);
    });

    bg.on('pointerdown', () => {
      // Click animation
      this.tweens.add({
        targets: bg,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true
      });
      this.time.delayedCall(150, () => {
        this.scene.stop();
        callback();
      });
    });
  }
}
