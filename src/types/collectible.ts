import { Vector2D } from './common';

export enum CollectibleType {
  CLUE = 'CLUE',
  LORE_ITEM = 'LORE_ITEM',
  ABILITY_CHARGE = 'ABILITY_CHARGE',
  COSMETIC_UNLOCK = 'COSMETIC_UNLOCK'
}

export interface Collectible {
  id: string;
  type: CollectibleType;
  position: Vector2D;
  isCollected: boolean;
}
