import { Inventory } from '@game-types/character';
import { AbilityType } from '@game-types/ability';
import { Collectible, CollectibleType } from '@game-types/collectible';
import { ClueCollectible } from './ClueCollectible';
import { LoreCollectible } from './LoreCollectible';
import { AbilityChargeCollectible } from './AbilityChargeCollectible';
import { CosmeticCollectible } from './CosmeticCollectible';

/**
 * InventorySystem - Manages the player's collected items
 */
export class InventorySystem {
  private inventory: Inventory;
  private collectionCallbacks: Map<CollectibleType, ((item: any) => void)[]>;

  constructor() {
    this.inventory = {
      clues: [],
      loreItems: [],
      abilityCharges: new Map<AbilityType, number>(),
      cosmetics: []
    };
    this.collectionCallbacks = new Map();
  }

  /**
   * Adds a collectible to the inventory
   */
  addCollectible(collectible: Collectible): boolean {
    if (collectible.isCollected) {
      return false; // Already collected
    }

    // Mark as collected
    collectible.isCollected = true;

    // Add to appropriate collection based on type
    switch (collectible.type) {
      case CollectibleType.CLUE:
        return this.addClue(collectible as ClueCollectible);
      
      case CollectibleType.LORE_ITEM:
        return this.addLoreItem(collectible as LoreCollectible);
      
      case CollectibleType.ABILITY_CHARGE:
        return this.addAbilityCharge(collectible as AbilityChargeCollectible);
      
      case CollectibleType.COSMETIC_UNLOCK:
        return this.addCosmetic(collectible as CosmeticCollectible);
      
      default:
        return false;
    }
  }

  /**
   * Adds a clue to the inventory
   */
  private addClue(clue: ClueCollectible): boolean {
    if (this.inventory.clues.includes(clue.id)) {
      return false; // Already have this clue
    }

    this.inventory.clues.push(clue.id);
    this.triggerCallbacks(CollectibleType.CLUE, clue.getData());
    return true;
  }

  /**
   * Adds a lore item to the inventory
   */
  private addLoreItem(loreItem: LoreCollectible): boolean {
    if (this.inventory.loreItems.includes(loreItem.id)) {
      return false; // Already have this lore item
    }

    this.inventory.loreItems.push(loreItem.id);
    this.triggerCallbacks(CollectibleType.LORE_ITEM, loreItem.getData());
    return true;
  }

  /**
   * Adds ability charges to the inventory
   */
  private addAbilityCharge(chargeItem: AbilityChargeCollectible): boolean {
    const abilityType = chargeItem.getAbilityType();
    const currentCharges = this.inventory.abilityCharges.get(abilityType) || 0;
    const newCharges = currentCharges + chargeItem.getChargeAmount();
    
    this.inventory.abilityCharges.set(abilityType, newCharges);
    this.triggerCallbacks(CollectibleType.ABILITY_CHARGE, chargeItem.getData());
    return true;
  }

  /**
   * Adds a cosmetic to the inventory
   */
  private addCosmetic(cosmetic: CosmeticCollectible): boolean {
    const cosmeticId = cosmetic.getCosmeticId();
    
    if (this.inventory.cosmetics.includes(cosmeticId)) {
      return false; // Already have this cosmetic
    }

    this.inventory.cosmetics.push(cosmeticId);
    this.triggerCallbacks(CollectibleType.COSMETIC_UNLOCK, cosmetic.getData());
    return true;
  }

  /**
   * Gets the current inventory
   */
  getInventory(): Inventory {
    return this.inventory;
  }

  /**
   * Checks if a clue is in the inventory
   */
  hasClue(clueId: string): boolean {
    return this.inventory.clues.includes(clueId);
  }

  /**
   * Gets all clues
   */
  getClues(): string[] {
    return [...this.inventory.clues];
  }

  /**
   * Checks if a lore item is in the inventory
   */
  hasLoreItem(loreId: string): boolean {
    return this.inventory.loreItems.includes(loreId);
  }

  /**
   * Gets all lore items
   */
  getLoreItems(): string[] {
    return [...this.inventory.loreItems];
  }

  /**
   * Gets ability charges for a specific ability
   */
  getAbilityCharges(abilityType: AbilityType): number {
    return this.inventory.abilityCharges.get(abilityType) || 0;
  }

  /**
   * Checks if a cosmetic is unlocked
   */
  hasCosmetic(cosmeticId: string): boolean {
    return this.inventory.cosmetics.includes(cosmeticId);
  }

  /**
   * Gets all cosmetics
   */
  getCosmetics(): string[] {
    return [...this.inventory.cosmetics];
  }

  /**
   * Registers a callback for when items of a specific type are collected
   */
  onCollect(type: CollectibleType, callback: (item: any) => void): void {
    if (!this.collectionCallbacks.has(type)) {
      this.collectionCallbacks.set(type, []);
    }
    this.collectionCallbacks.get(type)!.push(callback);
  }

  /**
   * Triggers callbacks for a collection event
   */
  private triggerCallbacks(type: CollectibleType, data: any): void {
    const callbacks = this.collectionCallbacks.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Clears the inventory (for testing or reset)
   */
  clear(): void {
    this.inventory = {
      clues: [],
      loreItems: [],
      abilityCharges: new Map<AbilityType, number>(),
      cosmetics: []
    };
  }

  /**
   * Loads inventory from saved data
   */
  loadInventory(savedInventory: Inventory): void {
    this.inventory = {
      clues: [...savedInventory.clues],
      loreItems: [...savedInventory.loreItems],
      abilityCharges: new Map(savedInventory.abilityCharges),
      cosmetics: [...savedInventory.cosmetics]
    };
  }
}
