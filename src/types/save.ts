import { LevelProgress } from './level';
import { GameSettings } from './config';

export interface InventoryData {
  clues: string[];
  loreItems: string[];
  abilityCharges: Record<string, number>;
  cosmetics: string[];
}

export interface CosmeticData {
  unlockedSkins: string[];
  selectedSkin: string;
}

export interface GameSaveData {
  version: string;
  timestamp: number;
  levelProgress: Record<string, LevelProgress>;
  currentLevel: string;
  currentChapter: number;
  unlockedMemories: string[];
  loreCollection: string[];
  inventory: InventoryData;
  cosmetics: CosmeticData;
  settings: GameSettings;
}
