import { Vector2D } from './common';

export enum PuzzleType {
  POSSESSION_PUZZLE = 'POSSESSION_PUZZLE',
  SEQUENCE_PUZZLE = 'SEQUENCE_PUZZLE',
  TIMING_PUZZLE = 'TIMING_PUZZLE',
  COLLECTION_PUZZLE = 'COLLECTION_PUZZLE'
}

export interface PuzzleElement {
  id: string;
  type: PuzzleType;
  position: Vector2D;
  isSolved: boolean;
  requiredItems: string[];
  unlocksPath: Vector2D[];
}
