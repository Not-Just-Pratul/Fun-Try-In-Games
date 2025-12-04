import Phaser from 'phaser';

interface LevelData {
  id: string;
  chapter: number;
  levelNumber: number;
  name: string;
  unlocked: boolean;
  completed: boolean;
  stars: number;
}

export class LevelSelectScene extends Phaser.Scene {
  private currentChapter: number = 1;
  private levelButtons: Phaser.GameObjects.Container[] = [];
  private chapterText?: Phaser.GameObjects.Text;
  private unlockedChapters: number[] = [];

  constructor() {
    super({ key: 'LevelSelect' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Load unlocked chapters from registry
    this.unlockedChapters = this.registry.get('unlockedChapters') || [1];
    
    // Start at highest unlocked chapter
    this.currentChapter = Math.max(...this.unlockedChapters);

    // Background
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    // Title
    this.add.text(width / 2, 50, 'SELECT LEVEL', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Chapter selector
    this.createChapterSelector(width / 2, 130);

    // Level grid
    this.createLevelGrid();

    // Back button
    this.createBackButton(60, 50);
  }

  private createChapterSelector(x: number, y: number): void {
    const container = this.add.container(x, y);

    const prevBtn = this.add.text(-100, 0, '◀', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    prevBtn.setInteractive({ useHandCursor: true });
    prevBtn.on('pointerover', () => prevBtn.setScale(1.2));
    prevBtn.on('pointerout', () => prevBtn.setScale(1));
    prevBtn.on('pointerdown', () => this.changeChapter(-1));

    this.chapterText = this.add.text(0, 0, `CHAPTER ${this.currentChapter}`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Show lock icon if chapter is locked
    const isLocked = !this.unlockedChapters.includes(this.currentChapter);
    if (isLocked) {
      this.chapterText.setText(`CHAPTER ${this.currentChapter} 🔒`);
      this.chapterText.setColor('#888888');
    }

    const nextBtn = this.add.text(100, 0, '▶', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    nextBtn.setInteractive({ useHandCursor: true });
    nextBtn.on('pointerover', () => nextBtn.setScale(1.2));
    nextBtn.on('pointerout', () => nextBtn.setScale(1));
    nextBtn.on('pointerdown', () => this.changeChapter(1));

    container.add([prevBtn, this.chapterText, nextBtn]);
  }

  private createLevelGrid(): void {
    const { width } = this.scale;
    const startY = 220;
    const levels = this.getLevelsForChapter(this.currentChapter);

    levels.forEach((level, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = width / 2 - 180 + col * 120;
      const y = startY + row * 140;

      const button = this.createLevelButton(x, y, level);
      this.levelButtons.push(button);
    });
  }

  private createLevelButton(x: number, y: number, level: LevelData): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 100, 100, 
      level.unlocked ? 0x3498db : 0x555555, 0.9);
    bg.setStrokeStyle(3, level.completed ? 0x2ecc71 : 0xffffff, 0.7);

    const levelNum = this.add.text(0, -10, level.levelNumber.toString(), {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const stars = this.add.text(0, 25, '⭐'.repeat(level.stars), {
      fontSize: '16px'
    }).setOrigin(0.5);

    button.add([bg, levelNum, stars]);

    if (level.unlocked) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setScale(1.1));
      bg.on('pointerout', () => bg.setScale(1));
      bg.on('pointerdown', () => this.startLevel(level));
    }

    return button;
  }

  private changeChapter(delta: number): void {
    const newChapter = this.currentChapter + delta;
    
    // Clamp between 1 and 5
    if (newChapter < 1 || newChapter > 5) {
      return;
    }
    
    this.currentChapter = newChapter;
    
    // Update chapter text
    if (this.chapterText) {
      const isLocked = !this.unlockedChapters.includes(this.currentChapter);
      if (isLocked) {
        this.chapterText.setText(`CHAPTER ${this.currentChapter} 🔒`);
        this.chapterText.setColor('#888888');
      } else {
        this.chapterText.setText(`CHAPTER ${this.currentChapter}`);
        this.chapterText.setColor('#ffffff');
      }
    }
    
    // Refresh level grid
    this.levelButtons.forEach(btn => btn.destroy());
    this.levelButtons = [];
    this.createLevelGrid();
  }

  private getLevelsForChapter(chapter: number): LevelData[] {
    // Check if chapter is unlocked
    const isChapterUnlocked = this.unlockedChapters.includes(chapter);
    
    // Get level progress from registry
    const levelProgress = this.registry.get('levelProgress') || {};
    
    const levels: LevelData[] = [];
    for (let i = 1; i <= 7; i++) {
      const levelId = `ch${chapter}_lv${i}`;
      const progress = levelProgress[levelId];
      
      // First level of unlocked chapter is always unlocked
      // Other levels unlock after completing previous level
      const isUnlocked = isChapterUnlocked && (i === 1 || levelProgress[`ch${chapter}_lv${i-1}`]?.completed);
      
      levels.push({
        id: levelId,
        chapter,
        levelNumber: i,
        name: `Level ${i}`,
        unlocked: isUnlocked,
        completed: progress?.completed || false,
        stars: progress?.stars || 0
      });
    }
    return levels;
  }

  private startLevel(level: LevelData): void {
    // Store current chapter in registry
    this.registry.set('currentChapter', level.chapter);
    this.registry.set('currentLevel', level.id);
    
    this.scene.stop();
    this.scene.start('GameScene', { 
      levelId: level.id,
      chapter: level.chapter 
    });
  }

  private createBackButton(x: number, y: number): void {
    const backBtn = this.add.text(x, y, '← BACK', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.start('MainMenu');
    });
  }
}
