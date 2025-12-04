import Phaser from 'phaser';
import { GhostCharacter } from '@components/GhostCharacter';
import { InputHandler } from '@core/InputHandler';
import { CollisionDetector } from '@core/CollisionDetector';
import { ProceduralMazeGenerator } from '@systems/ProceduralMazeGenerator';
import { Maze, MazeType, CellType } from '@game-types/maze';
import { AbilitySystem } from '@systems/AbilitySystem';
import { PhaseAbility } from '@systems/PhaseAbility';
import { PossessAbility } from '@systems/PossessAbility';
import { SenseAbility } from '@systems/SenseAbility';
import { SpeedBoostAbility } from '@systems/SpeedBoostAbility';
import { PuzzleManager } from '@systems/PuzzleManager';
import { PossessionPuzzle } from '@systems/PossessionPuzzle';
import { CollectionPuzzle } from '@systems/CollectionPuzzle';
import { SequencePuzzle } from '@systems/SequencePuzzle';
import { TimingPuzzle } from '@systems/TimingPuzzle';
import { ObstacleManager } from '@systems/ObstacleManager';
import { PhantomGuard } from '@systems/PhantomGuard';
import { CursedTrap, TrapEffectType } from '@systems/CursedTrap';
import { InventorySystem } from '@systems/InventorySystem';
import { CollectionFeedback } from '@systems/CollectionFeedback';
import { ClueCollectible } from '@systems/ClueCollectible';
import { LoreCollectible } from '@systems/LoreCollectible';
import { AbilityChargeCollectible } from '@systems/AbilityChargeCollectible';
import { CosmeticCollectible } from '@systems/CosmeticCollectible';
import { Collectible, CollectibleType } from '@game-types/collectible';
import { LevelManager } from '@systems/LevelManager';
import { LevelConfig, LevelStats } from '@game-types/level';
import { AbilityType } from '@game-types/ability';
import { StoryEngine, StoryEngineConfig } from '@systems/StoryEngine';
import { Memory, LoreItem } from '@game-types/story';
import { HUD } from '../ui/HUD';
import { AudioManager } from '@systems/AudioManager';
import { MusicTheme, AudioEventType } from '@game-types/audio';

/**
 * GameScene - Main gameplay scene
 */
export class GameScene extends Phaser.Scene {
  private ghost!: GhostCharacter;
  private inputHandler!: InputHandler;
  private collisionDetector!: CollisionDetector;
  private abilitySystem!: AbilitySystem;
  private audioManager!: AudioManager;
  private puzzleManager!: PuzzleManager;
  private obstacleManager!: ObstacleManager;
  private inventorySystem!: InventorySystem;
  private collectionFeedback!: CollectionFeedback;
  private levelManager!: LevelManager;
  private storyEngine!: StoryEngine;
  private maze!: Maze;
  private cellSize: number = 32;
  private mazeGraphics!: Phaser.GameObjects.Graphics;
  private hud!: HUD;
  private phaseGlow?: Phaser.GameObjects.Graphics;
  private puzzleGraphics!: Phaser.GameObjects.Graphics;
  private puzzleStatusText?: Phaser.GameObjects.Text;
  private inventory: string[] = [];
  private collectibles: Map<string, { item: Collectible, sprite: Phaser.GameObjects.Container }> = new Map();
  private guardSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private trapSprites: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private deathCount: number = 0;
  private levelStartTime: number = 0;
  private hintsUsedThisLevel: number = 0;
  private timerText?: Phaser.GameObjects.Text;
  private mazeOffsetX: number = 0;
  private mazeOffsetY: number = 0;
  private health: number = 3;
  private maxHealth: number = 3;
  private healthUI: Phaser.GameObjects.Text[] = [];
  private skillPoints: number = 0;
  private currentLevelSeed: number = 0;
  private isGameOver: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize audio system
    this.audioManager = new AudioManager(this);
    this.audioManager.initialize();
    this.audioManager.switchMusicTheme(MusicTheme.LINEAR);
    
    // Load player stats from shop purchases
    this.loadPlayerStats();
    
    // Initialize level manager
    this.initializeLevelManager();
    
    // Initialize story engine
    this.initializeStoryEngine();
    
    // Track level start time
    this.levelStartTime = Date.now();
    this.hintsUsedThisLevel = 0;
    
    // Generate a simple maze
    this.generateMaze();
    
    // Use FULL screen for maze - no reserved space
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    // Calculate cell size to fill entire screen
    const cellSizeX = Math.floor(screenWidth / this.maze.width);
    const cellSizeY = Math.floor(screenHeight / this.maze.height);
    this.cellSize = Math.min(cellSizeX, cellSizeY);
    
    // Calculate actual maze dimensions
    const mazeWidth = this.maze.width * this.cellSize;
    const mazeHeight = this.maze.height * this.cellSize;
    
    // Center maze on screen (no UI reserve)
    this.mazeOffsetX = (screenWidth - mazeWidth) / 2;
    this.mazeOffsetY = (screenHeight - mazeHeight) / 2;
    
    // Render the maze with offset
    this.renderMaze(this.mazeOffsetX, this.mazeOffsetY);
    
    // Setup inventory and collection systems
    this.setupInventorySystem();
    
    // Setup puzzle system
    this.setupPuzzles();
    
    // Render puzzles
    this.renderPuzzles();
    
    // Setup obstacles
    this.setupObstacles();
    
    // Render obstacles
    this.renderObstacles();
    
    // Create ghost at entrance (with maze offset)
    const startX = this.mazeOffsetX + this.maze.entrance.x * this.cellSize + this.cellSize / 2;
    const startY = this.mazeOffsetY + this.maze.entrance.y * this.cellSize + this.cellSize / 2;
    this.ghost = new GhostCharacter(this, startX, startY);
    
    // Setup ability system
    this.setupAbilities();
    
    // Setup input
    this.inputHandler = new InputHandler(this);
    
    // Setup collision detection
    this.collisionDetector = new CollisionDetector(this.maze, this.cellSize);
    this.collisionDetector.mazeOffsetX = this.mazeOffsetX;
    this.collisionDetector.mazeOffsetY = this.mazeOffsetY;
    
    // Create HUD
    this.hud = new HUD(this);
    
    // Setup HUD callbacks
    this.hud.onHintClicked(() => this.handleHintRequest());
    this.hud.onPauseClicked(() => {
      this.scene.pause();
      this.scene.launch('PauseMenu');
    });
    
    // Calculate maze boundaries for UI positioning (OUTSIDE maze)
    const mazeRight = this.mazeOffsetX + mazeWidth;
    const mazeBottom = this.mazeOffsetY + mazeHeight;
    const mazeTop = this.mazeOffsetY;
    
    // Position UI elements OUTSIDE the maze area
    // Health hearts at TOP LEFT (above maze)
    this.createHealthUI(10, 5);
    
    // Timer at TOP CENTER (above maze)
    this.timerText = this.add.text(screenWidth / 2, 5, '⏱️ 0:00', {
      fontSize: '18px',
      color: '#ffaa00',
      backgroundColor: '#1a0a2e',
      padding: { x: 10, y: 5 },
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(100);
    
    // Skill points at TOP RIGHT (above maze)
    this.add.text(screenWidth - 10, 5, `⭐ Skills: ${this.skillPoints}`, {
      fontSize: '18px',
      color: '#ffaa00',
      backgroundColor: '#1a0a2e',
      padding: { x: 10, y: 5 },
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(100);
    
    // Puzzle status at BOTTOM LEFT (below maze)
    this.puzzleStatusText = this.add.text(10, mazeBottom + 5, '', {
      fontSize: '15px',
      color: '#ffaa00',
      backgroundColor: '#1a0a2e',
      padding: { x: 10, y: 5 }
    }).setOrigin(0, 0).setDepth(100);
    
    // Instructions at BOTTOM CENTER (below maze)
    this.add.text(screenWidth / 2, mazeBottom + 5, '🎃 WASD: Move | E: Interact | 1: Phase | 2: Stun | 3: Reveal | 4: Speed', {
      fontSize: '12px',
      color: '#ff6600',
      backgroundColor: '#1a0a2e',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 0).setDepth(100);
    
    // Tips at BOTTOM CENTER-RIGHT (below maze)
    this.add.text(screenWidth / 2 + 100, mazeBottom + 5, '💡 Collect 🔑 keys, solve 📦 puzzles, avoid ⚠️ traps & 👻 guards to reach 🔴 exit!', {
      fontSize: '11px',
      color: '#ffaa00',
      backgroundColor: '#1a0a2e',
      padding: { x: 8, y: 4 }
    }).setOrigin(0, 0).setDepth(100);
    
    // Create collectibles panel at BOTTOM RIGHT (outside maze)
    this.createCollectiblesPanel(screenWidth - 220, mazeBottom + 5);
    
    // Setup interaction key
    this.input.keyboard?.on('keydown-E', () => {
      this.handleInteraction();
    });
    
    // Show ability tips
    this.showAbilityTips();
  }
  
  /**
   * Shows helpful tips about abilities
   */
  private showAbilityTips(): void {
    const screenWidth = this.cameras.main.width;
    
    // Show multiple tips in sequence
    const tips = [
      '💡 Press E near 📦 boxes to solve collection puzzles!',
      '💡 Press E near 🔒 locks to solve possession puzzles!',
      '💡 Press 1 to PHASE through walls! 👻',
      '💡 Press 2 near 👻 guards to STUN them! 💫',
      '💡 Press 3 to REVEAL guard paths! 👁️',
      '💡 Avoid ⚠️ traps - they slow you down!',
      '💡 Collect all 🔑 keys to solve puzzles!'
    ];
    
    let currentTip = 0;
    const showNextTip = () => {
      if (currentTip >= tips.length) return;
      
      const tipText = this.add.text(
        screenWidth / 2,
        5,
        tips[currentTip],
        {
          fontSize: '14px',
          color: '#ffaa00',
          backgroundColor: '#1a0a2e',
          padding: { x: 12, y: 6 }
        }
      ).setOrigin(0.5, 0).setDepth(100).setAlpha(0);
      
      // Fade in
      this.tweens.add({
        targets: tipText,
        alpha: 1,
        duration: 500
      });
      
      // Fade out after 3 seconds
      this.time.delayedCall(3000, () => {
        this.tweens.add({
          targets: tipText,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            tipText.destroy();
            currentTip++;
            if (currentTip < tips.length) {
              this.time.delayedCall(500, showNextTip);
            }
          }
        });
      });
    };
    
    showNextTip();
  }

  update(time: number, delta: number): void {
    // Stop updating if game is over
    if (this.isGameOver) {
      return;
    }
    
    // Get input direction
    const direction = this.inputHandler.getDirectionInput();
    
    if (direction) {
      // Store current position
      const oldX = this.ghost.x;
      const oldY = this.ghost.y;
      
      // Move ghost
      this.ghost.move(direction);
      this.ghost.update(delta);
      
      // Check collision (allow movement through walls if phase is active)
      const isPhasing = this.abilitySystem.isAbilityActive('PHASE' as any);
      
      // ALWAYS check maze boundaries - even when phasing
      if (!this.isWithinMazeBounds(this.ghost.x, this.ghost.y)) {
        this.ghost.setPosition(oldX, oldY);
      } else if (!isPhasing && !this.collisionDetector.canMoveTo(this.ghost, this.ghost.x, this.ghost.y)) {
        // Revert position if collision and not phasing
        this.ghost.setPosition(oldX, oldY);
      } else if (!isPhasing) {
        // If not phasing, make sure we're not stuck in a wall
        // This prevents getting stuck when phase ends
        const currentPos = this.ghost.getPosition();
        if (!this.collisionDetector.canMoveTo(this.ghost, currentPos.x, currentPos.y)) {
          // Find nearest valid position
          const nearestValid = this.findNearestValidPosition(currentPos);
          if (nearestValid) {
            this.ghost.setPosition(nearestValid.x, nearestValid.y);
            this.showMessage('⚠️ Teleported to safe position!', 0xffaa00);
          }
        }
      }
      
      // Check exit collision
      if (this.collisionDetector.checkExitCollision(this.ghost.getPosition())) {
        // Only allow exit if all puzzles are solved
        if (this.puzzleManager.areAllPuzzlesSolved()) {
          this.handleLevelComplete();
        } else {
          // Show message that puzzles need to be solved
          const unsolved = this.puzzleManager.getAllPuzzles().length - this.puzzleManager.getSolvedPuzzles().length;
          if (this.time.now % 2000 < 100) { // Show message every 2 seconds
            this.showMessage(`🔒 Solve ${unsolved} more puzzle${unsolved > 1 ? 's' : ''} to unlock exit!`, 0xff0000);
          }
        }
      }
    } else {
      this.ghost.stopMovement();
    }
    
    // Update HUD
    this.updateHUD();
    
    // Update visual effects
    this.updateVisualEffects();
    
    // Update puzzle status
    this.updatePuzzleStatus();
    
    // Update timer display
    this.updateTimer();
    
    // Update obstacles
    this.obstacleManager.update(delta);
    this.updateObstacleVisuals();
    
    // Check obstacle collisions
    this.checkObstacleCollisions();
    
    // Check collectible collisions
    this.checkCollectibleCollisions();
  }

  /**
   * Loads player stats from shop purchases
   */
  private loadPlayerStats(): void {
    // Load max health from shop purchases
    const savedMaxHealth = this.registry.get('maxHealth');
    if (savedMaxHealth !== undefined) {
      this.maxHealth = savedMaxHealth;
      this.health = this.maxHealth; // Start with full health
    }
    
    // Load ability charges from shop purchases
    const savedAbilityCharges = this.registry.get('abilityCharges');
    if (savedAbilityCharges) {
      // Will be applied when setting up abilities
      console.log('Loaded ability charges:', savedAbilityCharges);
    }
  }

  /**
   * Generates a simple maze with random seed
   */
  private generateMaze(): void {
    // Generate new random seed for each level
    this.currentLevelSeed = Date.now() + Math.random() * 1000;
    
    const generator = new ProceduralMazeGenerator();
    this.maze = generator.generate({
      type: MazeType.LINEAR,
      difficulty: 1.0,
      width: 15,
      height: 12,
      layers: 1,
      obstacleCount: 0,
      collectibleCount: 0,
      template: undefined
    });
  }
  
  /**
   * Creates health UI with hearts
   */
  private createHealthUI(x: number, y: number): void {
    this.healthUI = [];
    for (let i = 0; i < this.maxHealth; i++) {
      const heart = this.add.text(x + i * 40, y, '❤️', {
        fontSize: '24px',
        backgroundColor: '#1a0a2e',
        padding: { x: 5, y: 2 }
      }).setOrigin(0, 0).setDepth(100);
      this.healthUI.push(heart);
    }
    this.updateHealthUI();
  }
  
  /**
   * Updates health UI display
   */
  private updateHealthUI(): void {
    for (let i = 0; i < this.maxHealth; i++) {
      if (i < this.health) {
        this.healthUI[i].setText('❤️');
        this.healthUI[i].setAlpha(1);
      } else {
        this.healthUI[i].setText('🖤');
        this.healthUI[i].setAlpha(0.5);
      }
    }
  }
  
  /**
   * Creates collectibles panel at bottom right
   */
  private createCollectiblesPanel(x: number, y: number): void {
    // Panel background
    const panelBg = this.add.rectangle(x + 100, y + 50, 200, 100, 0x1a0a2e, 0.9);
    panelBg.setStrokeStyle(2, 0xff6600, 0.8);
    panelBg.setOrigin(0, 0);
    panelBg.setDepth(100);
    
    // Panel title
    this.add.text(x + 10, y + 5, '📦 COLLECTED', {
      fontSize: '14px',
      color: '#ff6600',
      fontStyle: 'bold'
    }).setOrigin(0, 0).setDepth(100);
    
    // Keys counter
    this.add.text(x + 10, y + 25, '🔑 Keys: 0/3', {
      fontSize: '12px',
      color: '#ffaa00'
    }).setOrigin(0, 0).setDepth(100);
    
    // Puzzles counter
    this.add.text(x + 10, y + 45, '📦 Puzzles: 0/2', {
      fontSize: '12px',
      color: '#ffaa00'
    }).setOrigin(0, 0).setDepth(100);
    
    // Lore counter
    this.add.text(x + 10, y + 65, '📜 Lore: 0/1', {
      fontSize: '12px',
      color: '#ffaa00'
    }).setOrigin(0, 0).setDepth(100);
    
    // Ability charges counter
    this.add.text(x + 10, y + 85, '⚡ Charges: 0', {
      fontSize: '12px',
      color: '#ffaa00'
    }).setOrigin(0, 0).setDepth(100);
  }
  
  /**
   * Takes damage and updates health
   */
  private takeDamage(amount: number = 1): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthUI();
    
    if (this.health <= 0) {
      this.handleGameOver();
    } else {
      this.showMessage(`💔 Lost ${amount} health! ${this.health}/${this.maxHealth} remaining`, 0xff0000);
    }
  }
  
  /**
   * Heals the player
   */
  private heal(amount: number = 1): void {
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    const healed = this.health - oldHealth;
    
    if (healed > 0) {
      this.updateHealthUI();
      this.showMessage(`💚 Healed ${healed} health! ${this.health}/${this.maxHealth}`, 0x00ff00);
      
      // Healing effect
      this.cameras.main.flash(300, 0, 255, 0, false);
    }
  }
  
  /**
   * Handles game over
   */
  private handleGameOver(): void {
    this.isGameOver = true;
    
    this.showMessage('💀 GAME OVER! All lives lost!\n\nPress SPACE to restart', 0xff0000);
    
    // Disable input
    this.input.keyboard?.removeAllListeners();
    
    // Restart on space
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.health = this.maxHealth;
      this.isGameOver = false;
      this.scene.restart();
    });
  }

  /**
   * Renders the maze with Halloween theme
   */
  private renderMaze(offsetX: number = 0, offsetY: number = 0): void {
    // Halloween background - dark purple/black
    this.cameras.main.setBackgroundColor('#0a0015');
    
    this.mazeGraphics = this.add.graphics();
    
    // Store offset for later use
    (this.mazeGraphics as any).offsetX = offsetX;
    (this.mazeGraphics as any).offsetY = offsetY;
    
    // Draw cells
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const cell = this.maze.grid[y][x];
        const pixelX = offsetX + x * this.cellSize;
        const pixelY = offsetY + y * this.cellSize;
        
        // Draw floor - dark purple/black
        if (cell.type === CellType.EMPTY) {
          this.mazeGraphics.fillStyle(0x1a0a2e, 1); // Dark purple
        } else {
          this.mazeGraphics.fillStyle(0x0a0015, 1); // Almost black
        }
        this.mazeGraphics.fillRect(pixelX, pixelY, this.cellSize, this.cellSize);
        
        // Draw walls - orange/pumpkin color
        this.mazeGraphics.lineStyle(3, 0xff6600, 1);
        
        if (cell.walls.north) {
          this.mazeGraphics.lineBetween(
            pixelX, pixelY,
            pixelX + this.cellSize, pixelY
          );
        }
        if (cell.walls.south) {
          this.mazeGraphics.lineBetween(
            pixelX, pixelY + this.cellSize,
            pixelX + this.cellSize, pixelY + this.cellSize
          );
        }
        if (cell.walls.west) {
          this.mazeGraphics.lineBetween(
            pixelX, pixelY,
            pixelX, pixelY + this.cellSize
          );
        }
        if (cell.walls.east) {
          this.mazeGraphics.lineBetween(
            pixelX + this.cellSize, pixelY,
            pixelX + this.cellSize, pixelY + this.cellSize
          );
        }
      }
    }
    
    // Draw entrance - eerie green glow
    const entranceX = offsetX + this.maze.entrance.x * this.cellSize;
    const entranceY = offsetY + this.maze.entrance.y * this.cellSize;
    this.mazeGraphics.fillStyle(0x00ff00, 0.4);
    this.mazeGraphics.fillRect(entranceX, entranceY, this.cellSize, this.cellSize);
    this.mazeGraphics.lineStyle(2, 0x00ff00, 0.8);
    this.mazeGraphics.strokeRect(entranceX, entranceY, this.cellSize, this.cellSize);
    
    // Draw exit - blood red portal
    const exitX = offsetX + this.maze.exit.x * this.cellSize;
    const exitY = offsetY + this.maze.exit.y * this.cellSize;
    this.mazeGraphics.fillStyle(0xcc0000, 0.6);
    this.mazeGraphics.fillRect(exitX, exitY, this.cellSize, this.cellSize);
    this.mazeGraphics.lineStyle(2, 0xff0000, 1);
    this.mazeGraphics.strokeRect(exitX, exitY, this.cellSize, this.cellSize);
  }

  /**
   * Sets up the ability system
   */
  private setupAbilities(): void {
    // Create ability system
    this.abilitySystem = new AbilitySystem(this);
    
    // Register all abilities
    this.abilitySystem.registerAbility(new PhaseAbility());
    this.abilitySystem.registerAbility(new PossessAbility());
    this.abilitySystem.registerAbility(new SenseAbility());
    this.abilitySystem.registerAbility(new SpeedBoostAbility());
    
    // Load saved ability charges from shop purchases
    const savedAbilityCharges = this.registry.get('abilityCharges');
    if (savedAbilityCharges) {
      // Add extra charges from shop purchases
      if (savedAbilityCharges.PHASE > 3) {
        const extraCharges = savedAbilityCharges.PHASE - 3;
        for (let i = 0; i < extraCharges; i++) {
          this.abilitySystem.addCharge('PHASE' as any);
        }
      }
      if (savedAbilityCharges.POSSESS > 3) {
        const extraCharges = savedAbilityCharges.POSSESS - 3;
        for (let i = 0; i < extraCharges; i++) {
          this.abilitySystem.addCharge('POSSESS' as any);
        }
      }
      if (savedAbilityCharges.SENSE > 3) {
        const extraCharges = savedAbilityCharges.SENSE - 3;
        for (let i = 0; i < extraCharges; i++) {
          this.abilitySystem.addCharge('SENSE' as any);
        }
      }
      if (savedAbilityCharges.SPEED_BOOST > 3) {
        const extraCharges = savedAbilityCharges.SPEED_BOOST - 3;
        for (let i = 0; i < extraCharges; i++) {
          this.abilitySystem.addCharge('SPEED_BOOST' as any);
        }
      }
    }
    
    // Connect to ghost
    this.ghost.setAbilitySystem(this.abilitySystem);
    
    // Setup ability hotkeys
    this.input.keyboard?.on('keydown-ONE', () => {
      const used = this.ghost.useAbility('PHASE' as any);
      if (used) {
        this.audioManager.playSoundEffect(AudioEventType.ABILITY_PHASE);
      }
    });
    
    this.input.keyboard?.on('keydown-TWO', () => {
      const used = this.ghost.useAbility('POSSESS' as any);
      if (used) {
        this.audioManager.playSoundEffect(AudioEventType.ABILITY_POSSESS);
        // Stun nearby guards when possess is activated
        this.stunNearbyGuards();
      }
    });
    
    this.input.keyboard?.on('keydown-THREE', () => {
      const used = this.ghost.useAbility('SENSE' as any);
      if (used) {
        this.audioManager.playSoundEffect(AudioEventType.ABILITY_SENSE);
        // Reveal guard patrol paths when sense is activated
        this.revealGuardPaths();
      }
    });
    
    this.input.keyboard?.on('keydown-FOUR', () => {
      const used = this.ghost.useAbility('SPEED_BOOST' as any);
      if (used) {
        this.audioManager.playSoundEffect(AudioEventType.ABILITY_SPEED_BOOST);
      }
    });
  }

  /**
   * Updates the HUD with current game state
   */
  private updateHUD(): void {
    // Update ability displays
    const abilities = [AbilityType.PHASE, AbilityType.POSSESS, AbilityType.SENSE, AbilityType.SPEED_BOOST];
    
    abilities.forEach(ability => {
      const status = this.abilitySystem.getAbilityStatus(ability);
      if (status) {
        this.hud.updateAbility(ability, status.charges, status.remainingCooldown / 1000);
      }
    });
    
    // Update hint button (simplified - always available for now)
    this.hud.updateHintButton(true, 0);
  }
  
  /**
   * Handles hint request from HUD
   */
  private handleHintRequest(): void {
    this.hintsUsedThisLevel++;
    this.showMessage('💡 Hint: Look for 🔑 keys and 📦 puzzles!', 0xffaa00);
  }

  /**
   * Updates visual effects for active abilities - Halloween themed
   */
  private updateVisualEffects(): void {
    // Phase ability - purple ghostly glow
    if (this.abilitySystem.isAbilityActive('PHASE' as any)) {
      this.ghost.setAlpha(0.5);
      
      // Add purple glow effect
      if (!this.phaseGlow) {
        this.phaseGlow = this.add.graphics();
        this.phaseGlow.setDepth(this.ghost.depth - 1);
      }
      
      this.phaseGlow.clear();
      this.phaseGlow.lineStyle(4, 0x9966ff, 0.6); // Purple
      this.phaseGlow.strokeCircle(this.ghost.x, this.ghost.y, 20);
      this.phaseGlow.lineStyle(2, 0x9966ff, 0.3);
      this.phaseGlow.strokeCircle(this.ghost.x, this.ghost.y, 25);
    } else {
      this.ghost.setAlpha(1);
      if (this.phaseGlow) {
        this.phaseGlow.clear();
      }
    }

    // Speed boost - orange pumpkin glow
    if (this.abilitySystem.isAbilityActive('SPEED_BOOST' as any)) {
      this.ghost.setTint(0xffaa00); // Golden orange
    } else {
      this.ghost.clearTint();
    }

    // Sense ability - toxic green pulse
    if (this.abilitySystem.isAbilityActive('SENSE' as any)) {
      const pulse = Math.sin(this.time.now / 200) * 0.2 + 0.8;
      this.ghost.setScale(pulse);
      this.ghost.setTint(0x00ff00); // Toxic green
    } else {
      this.ghost.setScale(1);
      if (!this.abilitySystem.isAbilityActive('SPEED_BOOST' as any)) {
        this.ghost.clearTint();
      }
    }
  }

  /**
   * Sets up the inventory and collection feedback systems
   */
  private setupInventorySystem(): void {
    this.inventorySystem = new InventorySystem();
    this.collectionFeedback = new CollectionFeedback(this);
    
    // Setup collection callbacks
    this.inventorySystem.onCollect(CollectibleType.CLUE, (data) => {
      console.log('Clue collected:', data);
    });
    
    this.inventorySystem.onCollect(CollectibleType.LORE_ITEM, (data) => {
      console.log('Lore item collected:', data);
      // Add to story engine
      if (this.storyEngine) {
        this.storyEngine.addLoreItem(data.id);
      }
    });
    
    this.inventorySystem.onCollect(CollectibleType.ABILITY_CHARGE, (data) => {
      // Add charge to ability system
      if (this.abilitySystem) {
        this.abilitySystem.addCharge(data.abilityType);
      }
    });
    
    this.inventorySystem.onCollect(CollectibleType.COSMETIC_UNLOCK, (data) => {
      console.log('Cosmetic unlocked:', data);
    });
  }

  /**
   * Sets up puzzles in the maze with RANDOM positions each time
   */
  private setupPuzzles(): void {
    this.puzzleManager = new PuzzleManager(this.maze);
    
    // Generate random positions for puzzles (avoiding entrance and exit)
    const getRandomPosition = () => {
      let x, y;
      do {
        x = Math.floor(Math.random() * (this.maze.width - 4)) + 2;
        y = Math.floor(Math.random() * (this.maze.height - 4)) + 2;
      } while (
        (x === this.maze.entrance.x && y === this.maze.entrance.y) ||
        (x === this.maze.exit.x && y === this.maze.exit.y)
      );
      return { x, y };
    };
    
    // Add a collection puzzle at random position
    const collectionPos = getRandomPosition();
    const collectionPuzzle = new CollectionPuzzle(
      'collection-1',
      collectionPos,
      ['key-red', 'key-blue'],
      [{ x: Math.floor(this.maze.width / 2), y: Math.floor(this.maze.height / 2) }]
    );
    this.puzzleManager.registerPuzzle(collectionPuzzle);
    
    // Add a possession puzzle at random position
    const possessionPos = getRandomPosition();
    const possessionPuzzle = new PossessionPuzzle(
      'possession-1',
      possessionPos,
      'statue-ancient',
      [{ x: Math.floor(this.maze.width * 2 / 3), y: Math.floor(this.maze.height / 2) }]
    );
    this.puzzleManager.registerPuzzle(possessionPuzzle);
    
    // Place collectible items in the maze (also randomized)
    this.placeCollectibles();
  }

  /**
   * Places collectible items in the maze with RANDOM positions
   */
  private placeCollectibles(): void {
    // Helper to get random position
    const getRandomPosition = () => {
      return {
        x: Math.floor(Math.random() * (this.maze.width - 4)) + 2,
        y: Math.floor(Math.random() * (this.maze.height - 4)) + 2
      };
    };
    
    // Place red key (clue collectible) - RANDOM
    const redKeyPos = getRandomPosition();
    const redKey = new ClueCollectible(
      'key-red',
      redKeyPos,
      'This red key might unlock something...',
      'collection-1'
    );
    this.createCollectibleSprite(redKey, '🔑', 0xff0000);
    
    // Place blue key (clue collectible) - RANDOM
    const blueKeyPos = getRandomPosition();
    const blueKey = new ClueCollectible(
      'key-blue',
      blueKeyPos,
      'This blue key completes the set!',
      'collection-1'
    );
    this.createCollectibleSprite(blueKey, '🔑', 0x0000ff);
    
    // Place statue (for possession puzzle) - RANDOM
    const statuePos = getRandomPosition();
    const statue = new ClueCollectible(
      'statue-ancient',
      statuePos,
      'An ancient statue that can be possessed',
      'possession-1'
    );
    this.createCollectibleSprite(statue, '🗿', 0x888888);
    
    // Add some lore collectibles - RANDOM
    const lore1Pos = getRandomPosition();
    const lore1 = new LoreCollectible(
      'lore-1',
      lore1Pos,
      'Lost Memory',
      'A fragment of your past',
      'You remember... the maze was once your home.'
    );
    this.createCollectibleSprite(lore1, '📜', 0x9370db);
    
    // Add ability charge collectibles - RANDOM
    const charge1Pos = getRandomPosition();
    const charge1 = new AbilityChargeCollectible(
      'charge-phase-1',
      charge1Pos,
      'PHASE' as any,
      1
    );
    this.createCollectibleSprite(charge1, '⚡', 0x9966ff);
    
    // Add cosmetic collectible - RANDOM
    const cosmeticPos = getRandomPosition();
    const cosmetic = new CosmeticCollectible(
      'cosmetic-1',
      cosmeticPos,
      'ghost-skin-spooky',
      'Spooky Ghost',
      'A more frightening appearance'
    );
    this.createCollectibleSprite(cosmetic, '👻', 0xff69b4);
  }

  /**
   * Creates a visual sprite for a collectible
   */
  private createCollectibleSprite(collectible: Collectible, emoji: string, color: number): void {
    const offsetX = (this.mazeGraphics as any).offsetX || 0;
    const offsetY = (this.mazeGraphics as any).offsetY || 0;
    const x = offsetX + collectible.position.x * this.cellSize + this.cellSize / 2;
    const y = offsetY + collectible.position.y * this.cellSize + this.cellSize / 2;
    
    // Create container for collectible
    const container = this.add.container(x, y);
    container.setDepth(50);
    container.setScrollFactor(0); // Don't scroll with camera
    
    // Create visual representation
    const text = this.add.text(0, 0, emoji, {
      fontSize: '20px'
    }).setOrigin(0.5);
    container.add(text);
    
    // Add glow effect
    const glow = this.add.graphics();
    glow.lineStyle(2, color, 0.5);
    glow.strokeCircle(0, 0, 15);
    container.add(glow);
    
    // Add pulsing animation
    this.tweens.add({
      targets: container,
      scale: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Store reference
    this.collectibles.set(collectible.id, { item: collectible, sprite: container });
  }

  /**
   * Renders puzzle indicators
   */
  private renderPuzzles(): void {
    this.puzzleGraphics = this.add.graphics();
    this.puzzleGraphics.setDepth(45);
    
    const offsetX = (this.mazeGraphics as any).offsetX || 0;
    const offsetY = (this.mazeGraphics as any).offsetY || 0;
    const puzzles = this.puzzleManager.getAllPuzzles();
    
    puzzles.forEach(puzzle => {
      const pos = puzzle.getPosition();
      const x = offsetX + pos.x * this.cellSize + this.cellSize / 2;
      const y = offsetY + pos.y * this.cellSize + this.cellSize / 2;
      
      // Draw puzzle indicator
      if (puzzle.getType() === 'COLLECTION_PUZZLE' as any) {
        // Chest icon for collection puzzle
        this.add.text(x, y, '📦', {
          fontSize: '24px'
        }).setOrigin(0.5).setDepth(50);
        
        this.puzzleGraphics.lineStyle(2, 0xffaa00, 0.6);
        this.puzzleGraphics.strokeCircle(x, y, 18);
      } else if (puzzle.getType() === 'POSSESSION_PUZZLE' as any) {
        // Lock icon for possession puzzle
        this.add.text(x, y, '🔒', {
          fontSize: '24px'
        }).setOrigin(0.5).setDepth(50);
        
        this.puzzleGraphics.lineStyle(2, 0xff6600, 0.6);
        this.puzzleGraphics.strokeCircle(x, y, 18);
      }
    });
  }

  /**
   * Checks for collisions with collectibles
   */
  private checkCollectibleCollisions(): void {
    const ghostPos = this.ghost.getPosition();
    const collectionRadius = this.cellSize * 0.6;
    
    this.collectibles.forEach((data, id) => {
      if (data.item.isCollected) return;
      
      const distance = Phaser.Math.Distance.Between(
        ghostPos.x, ghostPos.y,
        data.sprite.x, data.sprite.y
      );
      
      if (distance < collectionRadius) {
        this.collectItem(data.item, data.sprite);
      }
    });
  }

  /**
   * Collects an item
   */
  private collectItem(item: Collectible, sprite: Phaser.GameObjects.Container): void {
    // Add to inventory system
    const success = this.inventorySystem.addCollectible(item);
    
    if (success) {
      // Add to legacy inventory for puzzle compatibility
      this.inventory.push(item.id);
      
      // Play collection sound effect
      this.audioManager.playSoundEffect(AudioEventType.COLLECTIBLE_PICKUP);
      
      // Play collection feedback
      this.collectionFeedback.playCollectionFeedback(item.type, item.position);
      
      // Remove sprite with animation
      this.tweens.add({
        targets: sprite,
        scale: 0,
        alpha: 0,
        duration: 300,
        ease: 'Back.easeIn',
        onComplete: () => {
          sprite.destroy();
          this.collectibles.delete(item.id);
        }
      });
      
      // Show message based on type
      let message = 'Item Collected!';
      let color = 0x00ff00;
      
      switch (item.type) {
        case CollectibleType.CLUE:
          message = `Clue Found: ${item.id}`;
          color = 0xffff00;
          break;
        case CollectibleType.LORE_ITEM:
          message = 'Lore Discovered!';
          color = 0x9370db;
          break;
        case CollectibleType.ABILITY_CHARGE:
          message = 'Ability Charge +1';
          color = 0x00ffff;
          break;
        case CollectibleType.COSMETIC_UNLOCK:
          message = 'Cosmetic Unlocked!';
          color = 0xff69b4;
          break;
      }
      
      this.showMessage(message, color);
    }
  }

  /**
   * Handles player interaction with puzzles and collectibles
   */
  private handleInteraction(): void {
    const ghostPos = this.ghost.getPosition();
    const offsetX = (this.mazeGraphics as any).offsetX || 0;
    const offsetY = (this.mazeGraphics as any).offsetY || 0;
    const gridX = Math.floor((ghostPos.x - offsetX) / this.cellSize);
    const gridY = Math.floor((ghostPos.y - offsetY) / this.cellSize);
    
    // Check for puzzles within 2 cell radius
    const nearbyPuzzles = this.puzzleManager.getPuzzlesAtPosition({ x: gridX, y: gridY }, 2);
    
    if (nearbyPuzzles.length === 0) {
      this.showMessage(`No puzzle nearby. Look for 📦 (box) or 🔒 (lock) icons!`, 0xffaa00);
      return;
    }
    
    for (const puzzle of nearbyPuzzles) {
      if (!puzzle.getIsSolved()) {
        const context = {
          playerPosition: { x: gridX, y: gridY },
          inventory: this.inventory,
          possessedObjectId: this.inventory.find(item => item.startsWith('statue')) || undefined
        };
        
        const puzzleType = puzzle.getType();
        const solved = this.puzzleManager.attemptSolvePuzzle(puzzle.getId(), context);
        
        if (solved) {
          this.showMessage(`✅ Puzzle Solved! Path Unlocked! 🎉`, 0x00ff00);
          this.renderPuzzles(); // Update visuals
          
          // Flash the unlocked area
          this.cameras.main.flash(300, 0, 255, 0, false);
        } else {
          const missing = puzzle.getRequiredItems().filter(item => !this.inventory.includes(item));
          if (missing.length > 0) {
            if (puzzleType === 'COLLECTION_PUZZLE' as any) {
              this.showMessage(`📦 Collection Puzzle: Find ${missing.length} more item(s)!\nLook for 🔑 keys!`, 0xffff00);
            } else {
              this.showMessage(`Need: ${missing.join(', ')}`, 0xff0000);
            }
          } else if (puzzleType === 'POSSESSION_PUZZLE' as any) {
            this.showMessage(`🔒 Possession Puzzle: Press 2 to possess nearby objects!`, 0xff6600);
          } else {
            this.showMessage(`Try using an ability nearby!`, 0xff6600);
          }
        }
        break;
      } else {
        this.showMessage(`This puzzle is already solved! ✅`, 0x00ff00);
      }
    }
  }

  /**
   * Updates puzzle status display
   */
  private updatePuzzleStatus(): void {
    if (!this.puzzleStatusText) return;
    
    const total = this.puzzleManager.getAllPuzzles().length;
    const solved = this.puzzleManager.getSolvedPuzzles().length;
    
    const inv = this.inventorySystem.getInventory();
    const totalItems = inv.clues.length + inv.loreItems.length + inv.cosmetics.length;
    
    this.puzzleStatusText.setText(`🧩 Puzzles: ${solved}/${total} | 🎒 Items: ${totalItems} | 📜 Lore: ${inv.loreItems.length}`);
  }

  /**
   * Updates the timer display
   */
  private updateTimer(): void {
    if (!this.timerText) return;
    
    const elapsedMs = Date.now() - this.levelStartTime;
    const minutes = Math.floor(elapsedMs / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    
    this.timerText.setText(`⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  /**
   * Shows a temporary message
   */
  private showMessage(text: string, color: number): void {
    const msg = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      text,
      {
        fontSize: '24px',
        color: `#${color.toString(16).padStart(6, '0')}`,
        backgroundColor: '#1a0a2e',
        padding: { x: 15, y: 8 }
      }
    ).setOrigin(0.5).setDepth(200);
    
    // Fade out and destroy
    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: msg.y - 30,
      duration: 2000,
      onComplete: () => msg.destroy()
    });
  }

  /**
   * Sets up obstacles in the maze
   */
  private setupObstacles(): void {
    // Calculate entrance position with maze offset
    const entranceX = this.mazeOffsetX + this.maze.entrance.x * this.cellSize + this.cellSize / 2;
    const entranceY = this.mazeOffsetY + this.maze.entrance.y * this.cellSize + this.cellSize / 2;
    
    this.obstacleManager = new ObstacleManager({ x: entranceX, y: entranceY });
    
    // Add phantom guards with SPREAD OUT patrol paths
    // Guard 1: Top-left area
    const guard1Path = [
      { x: this.mazeOffsetX + 3 * this.cellSize, y: this.mazeOffsetY + 2 * this.cellSize },
      { x: this.mazeOffsetX + 6 * this.cellSize, y: this.mazeOffsetY + 2 * this.cellSize },
      { x: this.mazeOffsetX + 6 * this.cellSize, y: this.mazeOffsetY + 5 * this.cellSize },
      { x: this.mazeOffsetX + 3 * this.cellSize, y: this.mazeOffsetY + 5 * this.cellSize }
    ];
    const guard1 = new PhantomGuard('guard-1', guard1Path[0], guard1Path, 1.5);
    this.obstacleManager.registerObstacle(guard1);
    
    // Guard 2: Bottom-right area (far from guard 1)
    const guard2Path = [
      { x: this.mazeOffsetX + 10 * this.cellSize, y: this.mazeOffsetY + 8 * this.cellSize },
      { x: this.mazeOffsetX + 13 * this.cellSize, y: this.mazeOffsetY + 8 * this.cellSize },
      { x: this.mazeOffsetX + 13 * this.cellSize, y: this.mazeOffsetY + 10 * this.cellSize },
      { x: this.mazeOffsetX + 10 * this.cellSize, y: this.mazeOffsetY + 10 * this.cellSize }
    ];
    const guard2 = new PhantomGuard('guard-2', guard2Path[0], guard2Path, 1.5);
    this.obstacleManager.registerObstacle(guard2);
    
    // Add cursed traps in different areas
    const trap1 = new CursedTrap(
      'trap-1',
      { x: this.mazeOffsetX + 7 * this.cellSize + this.cellSize / 2, y: this.mazeOffsetY + 5 * this.cellSize + this.cellSize / 2 },
      { type: TrapEffectType.COOLDOWN_INCREASE, duration: 3000, magnitude: 2 },
      this.cellSize * 0.6
    );
    this.obstacleManager.registerObstacle(trap1);
    
    const trap2 = new CursedTrap(
      'trap-2',
      { x: this.mazeOffsetX + 4 * this.cellSize + this.cellSize / 2, y: this.mazeOffsetY + 9 * this.cellSize + this.cellSize / 2 },
      { type: TrapEffectType.MOVEMENT_RESTRICTION, duration: 2000, magnitude: 0.5 },
      this.cellSize * 0.6
    );
    this.obstacleManager.registerObstacle(trap2);
  }

  /**
   * Renders obstacles with visual representations
   */
  private renderObstacles(): void {
    // Render phantom guards
    const guards = this.obstacleManager.getPhantomGuards();
    guards.forEach(guard => {
      const pos = guard.getPosition();
      
      // Create guard container
      const container = this.add.container(pos.x, pos.y);
      container.setDepth(60);
      
      // Guard body - spooky ghost
      const guardText = this.add.text(0, 0, '👻', {
        fontSize: '28px'
      }).setOrigin(0.5);
      container.add(guardText);
      
      // Patrol path visualization (faint line)
      const pathGraphics = this.add.graphics();
      pathGraphics.lineStyle(1, 0xff0000, 0.3);
      const path = guard.getPatrolPath();
      if (path.length > 1) {
        pathGraphics.beginPath();
        pathGraphics.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          pathGraphics.lineTo(path[i].x, path[i].y);
        }
        pathGraphics.lineTo(path[0].x, path[0].y);
        pathGraphics.strokePath();
      }
      pathGraphics.setDepth(40);
      
      // Store references
      this.guardSprites.set(guard.getId(), container);
      (container as any).pathGraphics = pathGraphics;
    });
    
    // Render cursed traps
    const traps = this.obstacleManager.getCursedTraps();
    traps.forEach(trap => {
      const pos = trap.getPosition();
      
      // Create trap visual
      const trapGraphics = this.add.graphics();
      trapGraphics.setDepth(55);
      
      // Trap symbol
      this.add.text(pos.x, pos.y, '⚠️', {
        fontSize: '20px'
      }).setOrigin(0.5).setDepth(56);
      
      // Trigger radius indicator
      trapGraphics.lineStyle(2, 0xff0000, 0.4);
      trapGraphics.strokeCircle(pos.x, pos.y, trap.getTriggerRadius());
      
      // Pulsing danger zone
      trapGraphics.fillStyle(0xff0000, 0.1);
      trapGraphics.fillCircle(pos.x, pos.y, trap.getTriggerRadius());
      
      this.trapSprites.set(trap.getId(), trapGraphics);
    });
  }

  /**
   * Updates obstacle visuals
   */
  private updateObstacleVisuals(): void {
    // Update guard positions
    const guards = this.obstacleManager.getPhantomGuards();
    guards.forEach(guard => {
      const container = this.guardSprites.get(guard.getId());
      if (container) {
        const pos = guard.getPosition();
        container.setPosition(pos.x, pos.y);
        
        // Add pulsing glow effect
        const pulse = Math.sin(this.time.now / 300) * 0.2 + 0.8;
        container.setAlpha(pulse);
      }
    });
    
    // Update trap visuals
    const traps = this.obstacleManager.getCursedTraps();
    traps.forEach(trap => {
      const graphics = this.trapSprites.get(trap.getId());
      if (graphics) {
        const pos = trap.getPosition();
        graphics.clear();
        
        // Pulsing effect when active
        if (!trap.getIsTriggered()) {
          const pulse = Math.sin(this.time.now / 500) * 0.2 + 0.3;
          graphics.lineStyle(2, 0xff0000, pulse);
          graphics.strokeCircle(pos.x, pos.y, trap.getTriggerRadius());
          graphics.fillStyle(0xff0000, pulse * 0.3);
          graphics.fillCircle(pos.x, pos.y, trap.getTriggerRadius());
        } else {
          // Triggered - show cooldown
          graphics.lineStyle(2, 0x666666, 0.5);
          graphics.strokeCircle(pos.x, pos.y, trap.getTriggerRadius());
        }
      }
    });
  }

  /**
   * Checks collisions with obstacles
   */
  private checkObstacleCollisions(): void {
    const ghostPos = this.ghost.getPosition();
    
    // Check guard collisions
    const collidedGuard = this.obstacleManager.checkGuardCollision(ghostPos, 16);
    if (collidedGuard) {
      this.handleGuardCollision();
    }
    
    // Check trap collisions
    const triggeredTrap = this.obstacleManager.checkTrapCollision(ghostPos, 8);
    if (triggeredTrap) {
      this.handleTrapTrigger(triggeredTrap);
    }
  }

  /**
   * Handles collision with a phantom guard
   */
  private handleGuardCollision(): void {
    this.deathCount++;
    
    // Take damage
    this.takeDamage(1);
    
    if (this.health > 0) {
      // Show death message
      this.showMessage('💀 Caught by Guard! Respawning...', 0xff0000);
      
      // Flash effect
      this.cameras.main.flash(500, 255, 0, 0);
      
      // Reset to checkpoint
      const checkpoint = this.obstacleManager.getCheckpointPosition();
      this.ghost.setPosition(checkpoint.x, checkpoint.y);
      
      // Reset obstacles
      this.obstacleManager.resetAll();
    }
  }

  /**
   * Handles trap trigger
   */
  private handleTrapTrigger(trap: CursedTrap): void {
    const effect = trap.getEffect();
    
    // Show trap message with explanation
    let message = '⚠️ Trap Triggered!';
    if (effect.type === TrapEffectType.COOLDOWN_INCREASE) {
      message = '⚠️ TRAP! Ability cooldowns increased!\nAvoid ⚠️ symbols!';
    } else if (effect.type === TrapEffectType.MOVEMENT_RESTRICTION) {
      message = '⚠️ TRAP! Movement slowed!\nAvoid ⚠️ symbols!';
    }
    
    this.showMessage(message, 0xff0000);
    
    // Strong visual feedback
    this.cameras.main.shake(300, 0.01);
    this.cameras.main.flash(200, 255, 0, 0, false);
    
    // Apply effect with pulsing red tint
    this.ghost.setTint(0xff0000);
    
    // Pulse effect
    this.tweens.add({
      targets: this.ghost,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: Math.floor(effect.duration / 400)
    });
    
    this.time.delayedCall(effect.duration, () => {
      this.ghost.clearTint();
      this.ghost.setAlpha(1);
      this.showMessage('✅ Trap effect ended!', 0x00ff00);
    });
  }

  /**
   * Stuns nearby guards when possess ability is used
   */
  private stunNearbyGuards(): void {
    const ghostPos = this.ghost.getPosition();
    const guards = this.obstacleManager.getPhantomGuards();
    const stunRadius = this.cellSize * 3; // 3 cell radius
    
    let stunnedCount = 0;
    guards.forEach(guard => {
      const guardPos = guard.getPosition();
      const distance = Phaser.Math.Distance.Between(
        ghostPos.x, ghostPos.y,
        guardPos.x, guardPos.y
      );
      
      if (distance < stunRadius && guard.getIsActive()) {
        // Stun the guard for 3 seconds
        guard.deactivate();
        stunnedCount++;
        
        // Visual feedback - make guard transparent
        const container = this.guardSprites.get(guard.getId());
        if (container) {
          container.setAlpha(0.3);
          
          // Add stun effect
          const stunText = this.add.text(guardPos.x, guardPos.y - 30, '💫', {
            fontSize: '24px'
          }).setOrigin(0.5).setDepth(70);
          
          // Reactivate after 3 seconds
          this.time.delayedCall(3000, () => {
            guard.activate();
            container.setAlpha(1);
            stunText.destroy();
          });
        }
      }
    });
    
    if (stunnedCount > 0) {
      this.showMessage(`${stunnedCount} Guard${stunnedCount > 1 ? 's' : ''} Stunned! 💫`, 0xff6600);
    }
  }

  /**
   * Reveals guard patrol paths when sense ability is used
   */
  private revealGuardPaths(): void {
    const guards = this.obstacleManager.getPhantomGuards();
    
    guards.forEach(guard => {
      const container = this.guardSprites.get(guard.getId());
      if (container) {
        const pathGraphics = (container as any).pathGraphics as Phaser.GameObjects.Graphics;
        if (pathGraphics) {
          // Make path more visible temporarily
          pathGraphics.clear();
          pathGraphics.lineStyle(3, 0xff0000, 0.8);
          const path = guard.getPatrolPath();
          if (path.length > 1) {
            pathGraphics.beginPath();
            pathGraphics.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
              pathGraphics.lineTo(path[i].x, path[i].y);
            }
            pathGraphics.lineTo(path[0].x, path[0].y);
            pathGraphics.strokePath();
          }
          
          // Fade back after 5 seconds
          this.time.delayedCall(5000, () => {
            pathGraphics.clear();
            pathGraphics.lineStyle(1, 0xff0000, 0.3);
            if (path.length > 1) {
              pathGraphics.beginPath();
              pathGraphics.moveTo(path[0].x, path[0].y);
              for (let i = 1; i < path.length; i++) {
                pathGraphics.lineTo(path[i].x, path[i].y);
              }
              pathGraphics.lineTo(path[0].x, path[0].y);
              pathGraphics.strokePath();
            }
          });
        }
      }
    });
    
    this.showMessage('Guard Paths Revealed! 👁️', 0x00ff00);
  }

  /**
   * Initializes the story engine with memories and lore
   */
  private initializeStoryEngine(): void {
    // Create sample memories for each level
    const memories: Memory[] = [
      {
        id: 'memory-1',
        chapterNumber: 1,
        title: 'The Beginning',
        content: 'You remember... this maze was once your home. But something changed. Something dark.',
      },
      {
        id: 'memory-2',
        chapterNumber: 1,
        title: 'Lost in Shadows',
        content: 'The shadows grew deeper. You tried to escape, but the walls kept shifting.',
      },
      {
        id: 'memory-3',
        chapterNumber: 1,
        title: 'The Transformation',
        content: 'When did you become a ghost? The memory is hazy, like a dream fading at dawn.',
        cinematicData: {
          duration: 5000,
          scenes: [
            { text: 'Chapter 1 Complete', duration: 2000 },
            { text: 'The maze remembers...', duration: 3000 },
          ],
        },
      },
      {
        id: 'memory-4',
        chapterNumber: 2,
        title: 'Deeper Mysteries',
        content: 'The deeper you go, the more you remember. But are these memories real?',
      },
    ];
    
    // Create sample lore items
    const loreItems: LoreItem[] = [
      {
        id: 'lore-1',
        title: 'Ancient Inscription',
        description: 'A weathered stone tablet with cryptic symbols',
        unlockCondition: 'Found in the first chamber',
      },
      {
        id: 'lore-2',
        title: 'Forgotten Diary',
        description: 'Pages torn from an old journal, speaking of experiments gone wrong',
        unlockCondition: 'Hidden in the shadows',
      },
    ];
    
    const config: StoryEngineConfig = {
      memories,
      loreItems,
    };
    
    this.storyEngine = new StoryEngine(config);
    
    console.log('Story Engine initialized');
  }

  /**
   * Initializes the level manager with sample levels
   */
  private initializeLevelManager(): void {
    this.levelManager = new LevelManager();
    
    // Create sample level configurations
    const levelConfigs: LevelConfig[] = [
      {
        id: 'chapter1-level1',
        chapterNumber: 1,
        mazeConfig: {
          type: MazeType.LINEAR,
          difficulty: 1,
          width: 15,
          height: 12,
          layers: 1,
          obstacleCount: 2,
          collectibleCount: 5,
        },
        requiredPuzzles: ['collection-1', 'possession-1'],
        storyMemoryId: 'memory-1',
      },
      {
        id: 'chapter1-level2',
        chapterNumber: 1,
        mazeConfig: {
          type: MazeType.SHADOW,
          difficulty: 2,
          width: 18,
          height: 15,
          layers: 1,
          obstacleCount: 3,
          collectibleCount: 6,
        },
        requiredPuzzles: ['collection-2'],
        storyMemoryId: 'memory-2',
      },
      {
        id: 'chapter1-level3',
        chapterNumber: 1,
        mazeConfig: {
          type: MazeType.MULTI_LAYERED,
          difficulty: 3,
          width: 20,
          height: 18,
          layers: 2,
          obstacleCount: 4,
          collectibleCount: 8,
        },
        requiredPuzzles: ['sequence-1', 'timing-1'],
        storyMemoryId: 'memory-3',
      },
      {
        id: 'chapter2-level1',
        chapterNumber: 2,
        mazeConfig: {
          type: MazeType.MEMORY,
          difficulty: 4,
          width: 22,
          height: 20,
          layers: 1,
          obstacleCount: 5,
          collectibleCount: 10,
        },
        requiredPuzzles: ['collection-3', 'possession-2'],
        storyMemoryId: 'memory-4',
      },
    ];
    
    // Initialize with level configs
    this.levelManager.initialize(levelConfigs);
    
    // Set current level to first level
    this.levelManager.setCurrentLevel('chapter1-level1');
    
    console.log('Level Manager initialized');
    console.log('Current level:', this.levelManager.getCurrentLevel());
    console.log('Unlocked levels:', this.levelManager.getUnlockedLevels());
  }

  /**
   * Handles level completion - Halloween themed
   */
  private handleLevelComplete(): void {
    // Calculate completion time
    const completionTime = Date.now() - this.levelStartTime;
    
    // Create level stats
    const abilityUsage = new Map<AbilityType, number>();
    const stats: LevelStats = {
      completionTime,
      hintsUsed: this.hintsUsedThisLevel,
      abilitiesUsed: abilityUsage,
      deaths: this.deathCount,
    };
    
    // Complete the level in level manager
    const currentLevelId = this.levelManager.getCurrentLevel();
    this.levelManager.completeLevel(currentLevelId, stats);
    
    // Unlock memory for this level
    const unlockedMemory = this.storyEngine.unlockMemory(currentLevelId);
    
    // Get progress info
    const progress = this.levelManager.getLevelProgress(currentLevelId);
    const unlockedLevels = this.levelManager.getUnlockedLevels();
    const currentChapter = this.levelManager.getCurrentChapter();
    
    // Check if chapter is complete
    const chapterLevels = unlockedLevels.filter(id => id.startsWith(`chapter${currentChapter}`));
    const completedLevels = new Set(
      chapterLevels.filter(id => this.levelManager.getLevelProgress(id)?.completed)
    );
    const isChapterComplete = this.storyEngine.isChapterComplete(completedLevels, chapterLevels);
    
    console.log('Level completed!', {
      levelId: currentLevelId,
      progress,
      unlockedLevels,
      currentChapter,
      unlockedMemory,
      isChapterComplete,
    });
    
    // Calculate stars (simple algorithm)
    let stars = 1;
    if (this.deathCount === 0) stars++;
    if (this.hintsUsedThisLevel === 0) stars++;
    
    // Launch level complete scene
    this.scene.pause();
    this.scene.launch('LevelComplete', {
      stats: {
        completionTime: completionTime / 1000, // Convert to seconds
        hintsUsed: this.hintsUsedThisLevel,
        attempts: this.deathCount + 1,
        collectiblesFound: this.inventorySystem.getInventory().clues.length,
        totalCollectibles: this.collectibles.size,
        stars
      }
    });
    
    // Display narrative if memory was unlocked
    if (unlockedMemory) {
      this.time.delayedCall(2000, () => {
        this.scene.launch('StoryDisplay', {
          content: {
            title: unlockedMemory.title,
            text: unlockedMemory.content,
            type: 'memory' as const
          },
          onComplete: () => {
            // Story display closed
          }
        });
      });
    }
  }
  
  /**
   * Checks if position is within maze boundaries
   */
  private isWithinMazeBounds(x: number, y: number): boolean {
    const minX = this.mazeOffsetX;
    const maxX = this.mazeOffsetX + this.maze.width * this.cellSize;
    const minY = this.mazeOffsetY;
    const maxY = this.mazeOffsetY + this.maze.height * this.cellSize;
    
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }
  
  /**
   * Finds the nearest valid position when stuck in a wall
   */
  private findNearestValidPosition(currentPos: { x: number; y: number }): { x: number; y: number } | null {
    const searchRadius = this.cellSize * 2;
    const step = this.cellSize / 4;
    
    // Search in expanding circles
    for (let radius = step; radius <= searchRadius; radius += step) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const testX = currentPos.x + Math.cos(angle) * radius;
        const testY = currentPos.y + Math.sin(angle) * radius;
        
        if (this.collisionDetector.canMoveTo(this.ghost, testX, testY)) {
          return { x: testX, y: testY };
        }
      }
    }
    
    // Fallback to entrance
    const entranceX = this.mazeOffsetX + this.maze.entrance.x * this.cellSize + this.cellSize / 2;
    const entranceY = this.mazeOffsetY + this.maze.entrance.y * this.cellSize + this.cellSize / 2;
    return { x: entranceX, y: entranceY };
  }

  /**
   * Displays narrative content with gameplay pause
   */
  private displayNarrative(memory: Memory): void {
    // Use the new StoryDisplay scene
    this.scene.pause();
    this.scene.launch('StoryDisplay', {
      content: {
        title: memory.title,
        text: memory.content,
        type: 'memory' as const
      },
      onComplete: () => {
        this.scene.resume();
      }
    });
  }
}
