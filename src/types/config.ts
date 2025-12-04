import { AbilityConfig } from './ability';
import { MazeType } from './maze';

export interface GameConfig {
  targetFPS: number;
  inputResponseTimeMs: number;
  autoSaveIntervalMs: number;
  maxLoadTimeMs: number;
  abilities: AbilityConfig[];
  mazeTypes: MazeTypeConfig[];
  difficultySettings: DifficultyConfig;
}

export interface MazeTypeConfig {
  type: MazeType;
  baseComplexity: number;
  visibilityRadius?: number;
  memoryFadeDelayMs?: number;
}

export interface DifficultyConfig {
  baseComplexity: number;
  complexityIncreaseRate: number;
  adaptiveThreshold: number;
  hintCooldownMs: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  language: string;
  highContrastMode: boolean;
  colorblindMode: boolean;
  uiScale: number;
}
