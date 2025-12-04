import Phaser from 'phaser';
import { LocalStorageManager } from '../utils/LocalStorageManager';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'cosmetic' | 'ability_bundle' | 'chapter_unlock';
  owned: boolean;
  icon: string;
}

export class ShopScene extends Phaser.Scene {
  private items: ShopItem[] = [];
  private currency: number = 0;
  private currencyText?: Phaser.GameObjects.Text;
  private itemContainers: Phaser.GameObjects.Container[] = [];
  private adWatchCount: number = 0;
  private maxAdWatches: number = 5;
  private adButton?: Phaser.GameObjects.Container;
  private adButtonText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Shop' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    // Title
    this.add.text(width / 2, 50, 'SHOP', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Load shop items
    this.loadShopItems();

    // Currency display (create after loading items)
    this.currencyText = this.add.text(width - 150, 50, `💎 ${this.currency}`, {
      fontSize: '28px',
      color: '#f39c12',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(100);

    // Create item grid
    this.createItemGrid();

    // Back button
    this.createBackButton(60, 50);

    // Watch ad button
    this.createWatchAdButton(width / 2, height - 60);
  }

  private loadShopItems(): void {
    // Load from registry (persistent data)
    const savedCurrency = this.registry.get('playerCurrency');
    const savedAdCount = this.registry.get('adWatchCount');
    const ownedItems = this.registry.get('ownedShopItems') || [];
    
    this.currency = savedCurrency !== undefined ? savedCurrency : 150;
    this.adWatchCount = savedAdCount !== undefined ? savedAdCount : 0;
    
    // Shop items
    this.items = [
      {
        id: 'ghost_blue',
        name: 'Blue Ghost',
        description: 'A cool blue ghost skin',
        price: 100,
        type: 'cosmetic',
        owned: ownedItems.includes('ghost_blue'),
        icon: '💙'
      },
      {
        id: 'ghost_purple',
        name: 'Purple Ghost',
        description: 'A mystical purple ghost',
        price: 100,
        type: 'cosmetic',
        owned: ownedItems.includes('ghost_purple'),
        icon: '💜'
      },
      {
        id: 'ability_pack_1',
        name: 'Ability Pack',
        description: '+3 charges for all abilities',
        price: 50,
        type: 'ability_bundle',
        owned: ownedItems.includes('ability_pack_1'),
        icon: '⚡'
      },
      {
        id: 'health_pack',
        name: 'Health Pack',
        description: '+1 max health',
        price: 75,
        type: 'ability_bundle',
        owned: ownedItems.includes('health_pack'),
        icon: '❤️'
      },
      {
        id: 'chapter_2',
        name: 'Chapter 2',
        description: 'Unlock Chapter 2 levels',
        price: 200,
        type: 'chapter_unlock',
        owned: ownedItems.includes('chapter_2'),
        icon: '🔓'
      }
    ];
  }

  private createItemGrid(): void {
    const { width } = this.scale;
    const startY = 150;

    this.items.forEach((item, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = width / 2 - 220 + col * 220;
      const y = startY + row * 200;

      const container = this.createShopItem(x, y, item);
      this.itemContainers.push(container);
    });
  }

  private createShopItem(x: number, y: number, item: ShopItem): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(0, 0, 200, 180, 0x2a2a3e, 0.9);
    bg.setStrokeStyle(2, item.owned ? 0x2ecc71 : 0x6b6b8f);

    // Icon
    const icon = this.add.text(0, -50, item.icon, {
      fontSize: '48px'
    }).setOrigin(0.5);

    // Name
    const name = this.add.text(0, 0, item.name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Price or Owned
    if (item.owned) {
      const ownedText = this.add.text(0, 50, 'OWNED', {
        fontSize: '16px',
        color: '#2ecc71',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      container.add([bg, icon, name, ownedText]);
    } else {
      const priceText = this.add.text(0, 50, `💎 ${item.price}`, {
        fontSize: '20px',
        color: '#f39c12',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.purchaseItem(item));
      bg.on('pointerover', () => {
        bg.setScale(1.05);
        container.setDepth(10);
      });
      bg.on('pointerout', () => {
        bg.setScale(1);
        container.setDepth(0);
      });

      container.add([bg, icon, name, priceText]);
    }

    return container;
  }

  private purchaseItem(item: ShopItem): void {
    if (this.currency >= item.price && !item.owned) {
      this.currency -= item.price;
      item.owned = true;
      
      // Save to registry
      this.registry.set('playerCurrency', this.currency);
      const ownedItems = this.registry.get('ownedShopItems') || [];
      ownedItems.push(item.id);
      this.registry.set('ownedShopItems', ownedItems);
      
      // Apply item effects
      this.applyItemEffects(item);
      
      // Save to localStorage
      LocalStorageManager.saveToLocalStorage(this.registry);
      
      // Update currency display
      if (this.currencyText) {
        this.currencyText.setText(`💎 ${this.currency}`);
      }
      
      // Show purchase confirmation
      this.showPurchaseConfirmation(item.name);
      
      // Refresh display without restarting scene
      this.refreshItemGrid();
    } else if (this.currency < item.price) {
      this.showMessage('Not enough currency!', 0xe74c3c);
    }
  }

  private applyItemEffects(item: ShopItem): void {
    switch (item.type) {
      case 'cosmetic':
        // Unlock cosmetic in customization
        const unlockedCosmetics = this.registry.get('unlockedCosmetics') || [];
        if (!unlockedCosmetics.includes(item.id)) {
          unlockedCosmetics.push(item.id);
          this.registry.set('unlockedCosmetics', unlockedCosmetics);
        }
        break;
        
      case 'ability_bundle':
        if (item.id === 'ability_pack_1') {
          // Add 3 charges to all abilities
          const abilityCharges = this.registry.get('abilityCharges') || {
            PHASE: 3,
            POSSESS: 3,
            SENSE: 3,
            SPEED_BOOST: 3
          };
          abilityCharges.PHASE += 3;
          abilityCharges.POSSESS += 3;
          abilityCharges.SENSE += 3;
          abilityCharges.SPEED_BOOST += 3;
          this.registry.set('abilityCharges', abilityCharges);
          this.showMessage('✅ +3 charges to all abilities!', 0x2ecc71);
        } else if (item.id === 'health_pack') {
          // Increase max health
          const maxHealth = this.registry.get('maxHealth') || 3;
          this.registry.set('maxHealth', maxHealth + 1);
          this.showMessage('✅ Max health increased!', 0x2ecc71);
        }
        break;
        
      case 'chapter_unlock':
        // Unlock chapter
        const unlockedChapters = this.registry.get('unlockedChapters') || [1];
        if (!unlockedChapters.includes(2)) {
          unlockedChapters.push(2);
          this.registry.set('unlockedChapters', unlockedChapters);
          this.showMessage('✅ Chapter 2 unlocked!', 0x2ecc71);
        }
        break;
    }
  }

  private refreshItemGrid(): void {
    // Destroy old containers
    this.itemContainers.forEach(container => container.destroy());
    this.itemContainers = [];
    
    // Recreate grid
    this.createItemGrid();
  }

  private showPurchaseConfirmation(itemName: string): void {
    const { width, height } = this.scale;
    const text = this.add.text(width / 2, height / 2, `Purchased: ${itemName}`, {
      fontSize: '32px',
      color: '#2ecc71',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => text.destroy());
  }

  private showMessage(message: string, color: number = 0xe74c3c): void {
    const { width, height } = this.scale;
    const text = this.add.text(width / 2, height / 2, message, {
      fontSize: '24px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 50,
      duration: 2000,
      onComplete: () => text.destroy()
    });
  }

  private createWatchAdButton(x: number, y: number): void {
    this.adButton = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 350, 50, 0x9b59b6, 0.9);
    bg.setStrokeStyle(2, 0xffffff);

    const remaining = this.maxAdWatches - this.adWatchCount;
    const buttonText = remaining > 0 
      ? `📺 Watch Ad for 💎50 (${remaining}/${this.maxAdWatches})`
      : `📺 No Ads Left (${this.adWatchCount}/${this.maxAdWatches})`;

    this.adButtonText = this.add.text(0, 0, buttonText, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.adButton.add([bg, this.adButtonText]);

    if (remaining > 0) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setScale(1.05));
      bg.on('pointerout', () => bg.setScale(1));
      bg.on('pointerdown', () => this.watchAd());
    } else {
      bg.setFillStyle(0x555555, 0.9);
      this.adButtonText.setColor('#888888');
    }
  }

  private watchAd(): void {
    if (this.adWatchCount >= this.maxAdWatches) {
      this.showMessage('No more ads available today!', 0xff6600);
      return;
    }

    // Increment ad count
    this.adWatchCount++;
    this.registry.set('adWatchCount', this.adWatchCount);

    // Add currency
    this.currency += 50;
    this.registry.set('playerCurrency', this.currency);

    // Save to localStorage
    LocalStorageManager.saveToLocalStorage(this.registry);

    // Update displays
    if (this.currencyText) {
      this.currencyText.setText(`💎 ${this.currency}`);
    }

    // Show message
    this.showMessage(`✅ Earned 💎50! (${this.maxAdWatches - this.adWatchCount} ads left)`, 0x2ecc71);

    // Update button
    if (this.adButton && this.adButtonText) {
      const remaining = this.maxAdWatches - this.adWatchCount;
      
      if (remaining > 0) {
        this.adButtonText.setText(`📺 Watch Ad for 💎50 (${remaining}/${this.maxAdWatches})`);
      } else {
        this.adButtonText.setText(`📺 No Ads Left (${this.adWatchCount}/${this.maxAdWatches})`);
        this.adButtonText.setColor('#888888');
        
        const bg = this.adButton.getAt(0) as Phaser.GameObjects.Rectangle;
        bg.setFillStyle(0x555555, 0.9);
        bg.disableInteractive();
        bg.removeAllListeners();
      }
    }
  }

  private createBackButton(x: number, y: number): void {
    const backBtn = this.add.text(x, y, '← BACK', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setScale(1.1));
    backBtn.on('pointerout', () => backBtn.setScale(1));
    backBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.start('MainMenu');
    });
  }
}
