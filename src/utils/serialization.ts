import { GameSaveData } from '@game-types/save';

/**
 * Serializes game save data to JSON string
 */
export function serializeGameSaveData(data: GameSaveData): string {
  return JSON.stringify(data);
}

/**
 * Deserializes JSON string to game save data
 */
export function deserializeGameSaveData(json: string): GameSaveData {
  return JSON.parse(json) as GameSaveData;
}
