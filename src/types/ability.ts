export enum AbilityType {
  PHASE = 'PHASE',
  POSSESS = 'POSSESS',
  SENSE = 'SENSE',
  SPEED_BOOST = 'SPEED_BOOST'
}

export interface Ability {
  charges: number;
  maxCharges: number;
  cooldownMs: number;
  isActive: boolean;
}

export interface AbilityConfig {
  type: AbilityType;
  maxCharges: number;
  cooldownMs: number;
  durationMs: number;
  cost: number;
}
