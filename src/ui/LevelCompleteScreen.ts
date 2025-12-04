import Phaser from 'phaser';

interface LevelStats {
  completionTime: number;
  hintsUsed: number;
  attempts: number;
  collectiblesFound: number;
  totalCollectibles: number;
  stars: number;
}

export class LevelCompleteScene extends Phaser.Scene {
  private stats?: LevelStats;

  constructor() {
    super({ key: 'LevelComplete' });
  }

  init(data: { stats: LevelStats }): void {
    this.stats = data.stats;
  }

  create(): void {
    const { width, height } = this.scale;

    // Background overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

    // Victory panel
    const panel = this.add.rectangle(width / 2, height / 2, 500, 600, 0x2a2a3e, 0.95);
    panel.setStrokeStyle(4, 0xf39c12);

    // Title
    this.add.text(width / 2, height / 2 - 240, 'LEVEL COMPLETE!', {
      fontSize: '48px',
      color: '#f39c12',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stars
    if (this.stats) {
      const starText = '⭐'.repeat(this.stats.stars) + '☆'.repeat(3 - this.stats.stars);
      this.add.text(width / 2, height / 2 - 170, starText, {
        fontSize: '48px'
      }).setOrigin(0.5);

      // Stats
      this.displayStats(width / 2, height / 2 - 80);
    }

    // Buttons
    this.createButton(width / 2, height / 2 + 150, 'NEXT LEVEL', () => {
      this.scene.start('GameScene');
    }, 0x2ecc71);

    this.createButton(width / 2, height / 2 + 220, 'LEVEL SELECT', () => {
      this.scene.start('LevelSelect');
    }, 0x3498db);
  }

  private displayStats(x: number, y: number): void {
    if (!this.stats) return;

    const stats = [
      { label: 'Time', value: this.formatTime(this.stats.completionTime) },
      { label: 'Hints Used', value: this.stats.hintsUsed.toString() },
      { label: 'Attempts', value: this.stats.attempts.toString() },
      { label: 'Collectibles', value: `${this.stats.collectiblesFound}/${this.stats.totalCollectibles}` }
    ];

    stats.forEach((stat, index) => {
      const yPos = y + index * 50;
      
      this.add.text(x - 150, yPos, stat.label + ':', {
        fontSize: '20px',
        color: '#aaaaaa'
      });

      this.add.text(x + 150, yPos, stat.value, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(1, 0);
    });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    color: number
  ): void {
    const bg = this.add.rectangle(x, y, 300, 50, color, 0.9);
    bg.setStrokeStyle(2, 0xffffff, 0.5);

    const label = this.add.text(x, y, text, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setScale(1.05));
    bg.on('pointerout', () => bg.setScale(1));
    bg.on('pointerdown', callback);
  }
}
