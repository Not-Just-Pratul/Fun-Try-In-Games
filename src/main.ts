import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { 
  MainMenuScene, 
  LevelSelectScene, 
  PauseMenuScene, 
  SettingsScene,
  CustomizationScene,
  ShopScene,
  StoryDisplayScene,
  LevelCompleteScene
} from './ui';
import { LocalStorageManager } from './utils/LocalStorageManager';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [
    MainMenuScene,
    LevelSelectScene,
    GameScene,
    PauseMenuScene,
    SettingsScene,
    CustomizationScene,
    ShopScene,
    StoryDisplayScene,
    LevelCompleteScene
  ]
};

const game = new Phaser.Game(config);

// Load saved data from localStorage on game start
game.events.once('ready', () => {
  console.log('🎮 Game ready, loading saved data...');
  LocalStorageManager.loadFromLocalStorage(game.registry);
  
  // Auto-save every 30 seconds
  setInterval(() => {
    LocalStorageManager.saveToLocalStorage(game.registry);
  }, 30000);
  
  // Save on page unload
  window.addEventListener('beforeunload', () => {
    LocalStorageManager.saveToLocalStorage(game.registry);
  });
});

export default game;
