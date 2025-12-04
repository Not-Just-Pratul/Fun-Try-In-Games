import { CosmeticSkin, CosmeticRarity, UnlockConditionType } from '../types/cosmetic';

/**
 * Default cosmetic skins configuration
 */
export const DEFAULT_COSMETIC_SKINS: CosmeticSkin[] = [
  {
    id: 'default',
    name: 'Classic Ghost',
    description: 'The original ghostly appearance',
    rarity: CosmeticRarity.COMMON,
    unlockCondition: {
      type: UnlockConditionType.DEFAULT,
      description: 'Available from the start',
    },
    spriteKey: 'ghost_default',
    isUnlocked: true,
  },
  {
    id: 'ethereal_blue',
    name: 'Ethereal Blue',
    description: 'A calming blue spectral form',
    rarity: CosmeticRarity.COMMON,
    unlockCondition: {
      type: UnlockConditionType.LEVEL_COMPLETE,
      requirement: 'chapter1_level3',
      description: 'Complete Chapter 1, Level 3',
    },
    spriteKey: 'ghost_blue',
    isUnlocked: false,
  },
  {
    id: 'crimson_shade',
    name: 'Crimson Shade',
    description: 'A fierce red phantom',
    rarity: CosmeticRarity.RARE,
    unlockCondition: {
      type: UnlockConditionType.CHAPTER_COMPLETE,
      requirement: 1,
      description: 'Complete Chapter 1',
    },
    spriteKey: 'ghost_red',
    isUnlocked: false,
  },
  {
    id: 'golden_spirit',
    name: 'Golden Spirit',
    description: 'A radiant golden apparition',
    rarity: CosmeticRarity.EPIC,
    unlockCondition: {
      type: UnlockConditionType.COLLECTIBLE_COUNT,
      requirement: 50,
      description: 'Collect 50 lore items',
    },
    spriteKey: 'ghost_gold',
    isUnlocked: false,
  },
  {
    id: 'shadow_wraith',
    name: 'Shadow Wraith',
    description: 'A mysterious dark entity',
    rarity: CosmeticRarity.EPIC,
    unlockCondition: {
      type: UnlockConditionType.CHAPTER_COMPLETE,
      requirement: 2,
      description: 'Complete Chapter 2',
    },
    spriteKey: 'ghost_shadow',
    isUnlocked: false,
  },
  {
    id: 'prismatic_phantom',
    name: 'Prismatic Phantom',
    description: 'A dazzling rainbow specter',
    rarity: CosmeticRarity.LEGENDARY,
    unlockCondition: {
      type: UnlockConditionType.COLLECTIBLE_COUNT,
      requirement: 100,
      description: 'Collect all 100 collectibles',
    },
    spriteKey: 'ghost_prismatic',
    isUnlocked: false,
  },
  {
    id: 'ancient_soul',
    name: 'Ancient Soul',
    description: 'The form of a long-forgotten spirit',
    rarity: CosmeticRarity.LEGENDARY,
    unlockCondition: {
      type: UnlockConditionType.ACHIEVEMENT,
      requirement: 'complete_all_chapters',
      description: 'Complete all chapters',
    },
    spriteKey: 'ghost_ancient',
    isUnlocked: false,
  },
  {
    id: 'neon_ghost',
    name: 'Neon Ghost',
    description: 'A vibrant, glowing spirit',
    rarity: CosmeticRarity.RARE,
    unlockCondition: {
      type: UnlockConditionType.PURCHASE,
      description: 'Available for purchase',
    },
    spriteKey: 'ghost_neon',
    isUnlocked: false,
  },
];

/**
 * Load cosmetic skins from configuration
 */
export function loadCosmeticSkins(): CosmeticSkin[] {
  // In a real implementation, this could load from a JSON file or API
  return [...DEFAULT_COSMETIC_SKINS];
}

/**
 * Get cosmetic skin by ID
 */
export function getCosmeticSkinById(id: string): CosmeticSkin | undefined {
  return DEFAULT_COSMETIC_SKINS.find(skin => skin.id === id);
}

/**
 * Get cosmetic skins by rarity
 */
export function getCosmeticSkinsByRarity(rarity: CosmeticRarity): CosmeticSkin[] {
  return DEFAULT_COSMETIC_SKINS.filter(skin => skin.rarity === rarity);
}
