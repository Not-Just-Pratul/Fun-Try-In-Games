import { AbilityType } from './ability';
import { MazeConfig } from './maze';

export interface LevelProgress {
  levelId: string;
  completed: boolean;
  attempts: number;
  bestTime: number;
  hintsUsed: number;
  collectiblesFound: number;
}

export interface LevelStats {
  completionTime: number;
  hintsUsed: number;
  abilitiesUsed: Map<AbilityType, number>;
  deaths: number;
}

export interface LevelConfig {
  id: string;
  chapterNumber: number;
  mazeConfig: MazeConfig;
  requiredPuzzles: string[];
  storyMemoryId?: string;
}
