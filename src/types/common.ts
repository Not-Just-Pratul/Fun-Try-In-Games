// Core geometric types
export interface Vector2D {
  x: number;
  y: number;
}

export interface WallSet {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

// Direction enum for movement
export enum Direction {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST'
}
