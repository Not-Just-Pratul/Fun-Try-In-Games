/**
 * Cosmetic skin definition
 */
export interface CosmeticSkin {
  id: string;
  name: string;
  description: string;
  rarity: CosmeticRarity;
  unlockCondition: UnlockCondition;
  spriteKey: string;
  previewImage?: string;
  isUnlocked: boolean;
}

/**
 * Cosmetic rarity levels
 */
export enum CosmeticRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

/**
 * Unlock condition types
 */
export enum UnlockConditionType {
  DEFAULT = 'DEFAULT',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  CHAPTER_COMPLETE = 'CHAPTER_COMPLETE',
  COLLECTIBLE_COUNT = 'COLLECTIBLE_COUNT',
  PURCHASE = 'PURCHASE',
  ACHIEVEMENT = 'ACHIEVEMENT',
}

/**
 * Unlock condition definition
 */
export interface UnlockCondition {
  type: UnlockConditionType;
  requirement?: string | number;
  description: string;
}
