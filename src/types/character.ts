import { Vector2D } from './common';
import { Ability, AbilityType } from './ability';
import { Collectible } from './collectible';

export interface Inventory {
  clues: string[];
  loreItems: string[];
  abilityCharges: Map<AbilityType, number>;
  cosmetics: string[];
}

export interface AbilitySet {
  phase: Ability;
  possess: Ability;
  sense: Ability;
  speedBoost: Ability;
}

export interface GhostCharacter {
  position: Vector2D;
  velocity: Vector2D;
  abilities: AbilitySet;
  inventory: Inventory;
}
