import { Vector2D } from './common';

export enum ObstacleType {
  PHANTOM_GUARD = 'PHANTOM_GUARD',
  CURSED_TRAP = 'CURSED_TRAP',
  MOVING_WALL = 'MOVING_WALL',
  TIMED_BARRIER = 'TIMED_BARRIER'
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  position: Vector2D;
  patrolPath?: Vector2D[];
  isActive: boolean;
}
