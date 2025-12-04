import Phaser from 'phaser';
import { LocalStorageManager } from '../utils/LocalStorageManager';

interface CosmeticItem {
  id: string;
  name: string;
  type: 'skin' | 'trail' | 'effect';
  unlocked: boolean;
  equipped: boolean;
  preview: string;
}

export class CustomizationScene extends Phaser.Scene {
  private allCosmetics: CosmeticItem[] = [];
  private cosmetics: CosmeticItem[] = [];
  private selectedType: 'skin' | 'trail' | 'effect' = 'skin';
  private cosmeticContainers: Phaser.GameObjects.Container[] = [];
  private previewContainer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'Customization' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    // Title
    this.add.text(width / 2, 50, 'CUSTOMIZE', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Load cosmetics first
    this.loadCosmetics();

    // Category tabs
    this.createCategoryTabs(width / 2, 130);

    // Create cosmetic grid
    this.createCosmeticGrid();

    // Preview area
    this.createPreviewArea(width / 2, height - 150);

    // Back button
    this.createBackButton(60, 50);
  }

  private createCategoryTabs(x: number, y: number): void {
    const categories: Array<'skin' | 'trail' | 'effect'> = ['skin', 'trail', 'effect'];
    const labels = ['SKINS', 'TRAILS', 'EFFECTS'];

    categories.forEach((category, index) => {
      const tabX = x - 150 + index * 150;
      const isSelected = category === this.selectedType;

      const bg = this.add.rectangle(tabX, y, 140, 50, 
        isSelected ? 0x3498db : 0x2a2a3e, 0.9);
      bg.setStrokeStyle(2, isSelected ? 0xffffff : 0x6b6b8f);

      const text = this.add.text(tabX, y, labels[index], {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      if (!isSelected) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => bg.setScale(1.05));
        bg.on('pointerout', () => bg.setScale(1));
        bg.on('pointerdown', () => {
          this.selectedType = category;
          this.switchCategory();
        });
      }
    });
  }

  private switchCategory(): void {
    // Filter cosmetics for selected type
    this.cosmetics = this.allCosmetics.filter(item => item.type === this.selectedType);
    
    // Clear old containers
    this.cosmeticContainers.forEach(container => container.destroy());
    this.cosmeticContainers = [];
    
    // Recreate grid and preview
    this.createCosmeticGrid();
    this.updatePreview();
  }

  private loadCosmetics(): void {
    // Load unlocked cosmetics from registry
    const unlockedCosmetics = this.registry.get('unlockedCosmetics') || ['default_ghost'];
    const equippedCosmetics = this.registry.get('equippedCosmetics') || {
      skin: 'default_ghost',
      trail: 'sparkle_trail',
      effect: 'glow_effect'
    };
    
    // All available cosmetics
    this.allCosmetics = [
      // Skins
      {
        id: 'default_ghost',
        name: 'Default Ghost',
        type: 'skin' as const,
        unlocked: true,
        equipped: equippedCosmetics.skin === 'default_ghost',
        preview: '👻'
      },
      {
        id: 'ghost_blue',
        name: 'Blue Ghost',
        type: 'skin' as const,
        unlocked: unlockedCosmetics.includes('ghost_blue'),
        equipped: equippedCosmetics.skin === 'ghost_blue',
        preview: '💙'
      },
      {
        id: 'ghost_purple',
        name: 'Purple Ghost',
        type: 'skin' as const,
        unlocked: unlockedCosmetics.includes('ghost_purple'),
        equipped: equippedCosmetics.skin === 'ghost_purple',
        preview: '💜'
      },
      // Trails
      {
        id: 'sparkle_trail',
        name: 'Sparkle Trail',
        type: 'trail' as const,
        unlocked: true,
        equipped: equippedCosmetics.trail === 'sparkle_trail',
        preview: '✨'
      },
      {
        id: 'fire_trail',
        name: 'Fire Trail',
        type: 'trail' as const,
        unlocked: unlockedCosmetics.includes('fire_trail'),
        equipped: equippedCosmetics.trail === 'fire_trail',
        preview: '🔥'
      },
      // Effects
      {
        id: 'glow_effect',
        name: 'Glow Effect',
        type: 'effect' as const,
        unlocked: true,
        equipped: equippedCosmetics.effect === 'glow_effect',
        preview: '💫'
      },
      {
        id: 'shadow_effect',
        name: 'Shadow Effect',
        type: 'effect' as const,
        unlocked: unlockedCosmetics.includes('shadow_effect'),
        equipped: equippedCosmetics.effect === 'shadow_effect',
        preview: '🌑'
      }
    ];
    
    this.cosmetics = this.allCosmetics.filter(item => item.type === this.selectedType);
  }

  private createCosmeticGrid(): void {
    const { width } = this.scale;
    const startY = 220;

    this.cosmetics.forEach((cosmetic, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = width / 2 - 210 + col * 140;
      const y = startY + row * 140;

      const container = this.createCosmeticItem(x, y, cosmetic);
      this.cosmeticContainers.push(container);
    });
  }

  private createCosmeticItem(x: number, y: number, cosmetic: CosmeticItem): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Background
    const bgColor = cosmetic.equipped ? 0x2ecc71 : 
                    cosmetic.unlocked ? 0x3498db : 0x555555;
    const bg = this.add.rectangle(0, 0, 120, 120, bgColor, 0.9);
    bg.setStrokeStyle(3, cosmetic.equipped ? 0xffffff : 0x6b6b8f);

    // Preview
    const preview = this.add.text(0, -15, cosmetic.preview, {
      fontSize: '48px'
    }).setOrigin(0.5);

    // Name
    const name = this.add.text(0, 35, cosmetic.name, {
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 110 }
    }).setOrigin(0.5);

    // Lock icon if not unlocked
    if (!cosmetic.unlocked) {
      const lock = this.add.text(0, -15, '🔒', {
        fontSize: '32px'
      }).setOrigin(0.5);
      container.add([bg, lock, name]);
    } else {
      container.add([bg, preview, name]);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.equipCosmetic(cosmetic));
      bg.on('pointerover', () => {
        bg.setScale(1.05);
        container.setDepth(10);
      });
      bg.on('pointerout', () => {
        bg.setScale(1);
        container.setDepth(0);
      });
    }

    return container;
  }

  private equipCosmetic(cosmetic: CosmeticItem): void {
    if (!cosmetic.unlocked) {
      this.showMessage('🔒 This item is locked! Purchase it in the shop.', 0xff6600);
      return;
    }

    // Unequip all of this type in allCosmetics
    this.allCosmetics.forEach(c => {
      if (c.type === cosmetic.type) {
        c.equipped = false;
      }
    });

    // Equip selected
    cosmetic.equipped = true;

    // Save to registry
    const equippedCosmetics = this.registry.get('equippedCosmetics') || {};
    equippedCosmetics[cosmetic.type] = cosmetic.id;
    this.registry.set('equippedCosmetics', equippedCosmetics);

    // Save to localStorage
    LocalStorageManager.saveToLocalStorage(this.registry);

    // Show feedback
    this.showMessage(`✅ Equipped: ${cosmetic.name}`, 0x2ecc71);

    // Refresh display without restarting
    this.refreshGrid();
    this.updatePreview();
  }

  private showMessage(message: string, color: number): void {
    const { width, height } = this.scale;
    const text = this.add.text(width / 2, height / 2, message, {
      fontSize: '20px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 40,
      duration: 2000,
      onComplete: () => text.destroy()
    });
  }

  private refreshGrid(): void {
    // Clear old containers
    this.cosmeticContainers.forEach(container => container.destroy());
    this.cosmeticContainers = [];
    
    // Recreate grid
    this.createCosmeticGrid();
  }

  private createPreviewArea(x: number, y: number): void {
    const bg = this.add.rectangle(x, y, 400, 120, 0x2a2a3e, 0.9);
    bg.setStrokeStyle(2, 0x6b6b8f);

    this.add.text(x, y - 40, 'PREVIEW', {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Create preview container
    this.previewContainer = this.add.container(x, y + 10);
    this.updatePreview();
  }

  private updatePreview(): void {
    if (!this.previewContainer) return;

    // Clear existing preview
    this.previewContainer.removeAll(true);

    // Show all equipped cosmetics from all types
    const equippedSkin = this.allCosmetics.find(c => c.type === 'skin' && c.equipped);
    const equippedTrail = this.allCosmetics.find(c => c.type === 'trail' && c.equipped);
    const equippedEffect = this.allCosmetics.find(c => c.type === 'effect' && c.equipped);

    const previews: string[] = [];
    if (equippedSkin) previews.push(equippedSkin.preview);
    if (equippedTrail) previews.push(equippedTrail.preview);
    if (equippedEffect) previews.push(equippedEffect.preview);

    const previewText = previews.join(' ') || '👻';

    const text = this.add.text(0, 0, previewText, {
      fontSize: '48px'
    }).setOrigin(0.5);

    this.previewContainer.add(text);
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
