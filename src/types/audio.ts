/**
 * Audio event types that trigger sound effects or music
 */
export enum AudioEventType {
  // Ability events
  ABILITY_PHASE = 'ABILITY_PHASE',
  ABILITY_POSSESS = 'ABILITY_POSSESS',
  ABILITY_SENSE = 'ABILITY_SENSE',
  ABILITY_SPEED_BOOST = 'ABILITY_SPEED_BOOST',
  
  // Environmental events
  COLLECTIBLE_PICKUP = 'COLLECTIBLE_PICKUP',
  PUZZLE_SOLVED = 'PUZZLE_SOLVED',
  DOOR_UNLOCK = 'DOOR_UNLOCK',
  TRAP_TRIGGERED = 'TRAP_TRIGGERED',
  GUARD_PROXIMITY = 'GUARD_PROXIMITY',
  DEATH = 'DEATH',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  
  // UI events
  MENU_SELECT = 'MENU_SELECT',
  MENU_BACK = 'MENU_BACK',
  HINT_USED = 'HINT_USED',
}

/**
 * Music theme types for different maze environments
 */
export enum MusicTheme {
  MENU = 'MENU',
  LINEAR = 'LINEAR',
  SHADOW = 'SHADOW',
  MEMORY = 'MEMORY',
  MULTI_LAYERED = 'MULTI_LAYERED',
  TIME_CHANGING = 'TIME_CHANGING',
  BOSS = 'BOSS',
  VICTORY = 'VICTORY',
}

/**
 * Audio configuration for a sound effect
 */
export interface SoundConfig {
  key: string;
  volume: number;
  loop: boolean;
  echoEffect?: boolean;
}

/**
 * Audio configuration for background music
 */
export interface MusicConfig {
  key: string;
  volume: number;
  loop: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

/**
 * Volume settings for different audio categories
 */
export interface VolumeSettings {
  master: number;
  music: number;
  sfx: number;
  voice: number;
}
