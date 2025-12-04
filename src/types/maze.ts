import { Vector2D, WallSet } from './common';
import { Obstacle } from './obstacle';
import { Collectible } from './collectible';
import { PuzzleElement } from './puzzle';

export enum MazeType {
  LINEAR = 'LINEAR',
  MULTI_LAYERED = 'MULTI_LAYERED',
  TIME_CHANGING = 'TIME_CHANGING',
  SHADOW = 'SHADOW',
  MEMORY = 'MEMORY'
}

export enum CellType {
  EMPTY = 'EMPTY',
  WALL = 'WALL',
  PHASING_WALL = 'PHASING_WALL',
  PUZZLE_DOOR = 'PUZZLE_DOOR',
  CHECKPOINT = 'CHECKPOINT'
}

export interface Cell {
  position: Vector2D;
  type: CellType;
  walls: WallSet;
  isVisible: boolean;
  isRevealed: boolean;
}

export interface Maze {
  type: MazeType;
  grid: Cell[][];
  width: number;
  height: number;
  layers: number;
  entrance: Vector2D;
  exit: Vector2D;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  getCell(position: Vector2D): Cell | undefined;
  isWalkable(position: Vector2D): boolean;
  isSolvable(): boolean;
}

export interface MazeConfig {
  type: MazeType;
  difficulty: number;
  width: number;
  height: number;
  layers: number;
  obstacleCount: number;
  collectibleCount: number;
  template?: MazeTemplate;
}

export interface MazeTemplate {
  id: string;
  grid: Cell[][];
  puzzleElements: PuzzleElement[];
}
