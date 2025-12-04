import Phaser from 'phaser';

interface StoryContent {
  title: string;
  text: string;
  type: 'memory' | 'cutscene' | 'lore';
}

export class StoryDisplayScene extends Phaser.Scene {
  private content?: StoryContent;
  private onComplete?: () => void;

  constructor() {
    super({ key: 'StoryDisplay' });
  }

  init(data: { content: StoryContent; onComplete?: () => void }): void {
    this.content = data.content;
    this.onComplete = data.onComplete;
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(0, 0, width, height, 0x0a0a1e, 0.95).setOrigin(0);

    if (!this.content) return;

    // Title
    this.add.text(width / 2, 100, this.content.title, {
      fontSize: '36px',
      color: '#f39c12',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Story text
    const textBox = this.add.text(width / 2, height / 2, this.content.text, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 100 }
    }).setOrigin(0.5);

    // Type indicator
    const typeColor = this.content.type === 'memory' ? '#9b59b6' : 
                      this.content.type === 'cutscene' ? '#e74c3c' : '#3498db';
    
    this.add.text(width / 2, 50, this.content.type.toUpperCase(), {
      fontSize: '16px',
      color: typeColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Controls
    this.createControls(width, height);
  }

  private createControls(width: number, height: number): void {
    const y = height - 80;

    // Skip button
    const skipBtn = this.add.text(width / 2 - 100, y, 'SKIP', {
      fontSize: '24px',
      color: '#e74c3c',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    skipBtn.setInteractive({ useHandCursor: true });
    skipBtn.on('pointerdown', () => this.close());

    // Continue button
    const continueBtn = this.add.text(width / 2 + 100, y, 'CONTINUE', {
      fontSize: '24px',
      color: '#2ecc71',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    continueBtn.setInteractive({ useHandCursor: true });
    continueBtn.on('pointerdown', () => this.close());

    // Hint text
    this.add.text(width / 2, height - 30, 'Press SPACE or tap to continue', {
      fontSize: '14px',
      color: '#888888',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Keyboard input
    this.input.keyboard?.once('keydown-SPACE', () => this.close());
  }

  private close(): void {
    if (this.onComplete) {
      this.onComplete();
    }
    this.scene.stop();
  }
}
