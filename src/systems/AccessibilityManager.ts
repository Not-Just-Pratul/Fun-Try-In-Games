import Phaser from 'phaser';

/**
 * AccessibilityManager - Manages accessibility features
 */
export class AccessibilityManager {
  private scene: Phaser.Scene;
  private settings: AccessibilitySettings;
  private originalColors: Map<string, number> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.settings = this.getDefaultSettings();
  }

  /**
   * Gets default accessibility settings
   */
  private getDefaultSettings(): AccessibilitySettings {
    return {
      highContrastMode: false,
      colorblindMode: ColorblindMode.NONE,
      uiScale: 1.0,
      showSubtitles: true,
      visualHints: true,
      touchTargetSize: 44,
      keyboardNavigation: true,
      reducedMotion: false
    };
  }

  /**
   * Applies accessibility settings
   */
  public applySettings(settings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    if (settings.highContrastMode !== undefined) {
      this.applyHighContrast(settings.highContrastMode);
    }
    
    if (settings.colorblindMode !== undefined) {
      this.applyColorblindMode(settings.colorblindMode);
    }
    
    if (settings.uiScale !== undefined) {
      this.applyUIScale(settings.uiScale);
    }
  }

  /**
   * Applies high contrast mode
   */
  private applyHighContrast(enabled: boolean): void {
    if (enabled) {
      // Store original colors
      // Apply high contrast colors
      this.scene.cameras.main.setBackgroundColor('#000000');
    } else {
      // Restore original colors
      this.scene.cameras.main.setBackgroundColor('#1a1a2e');
    }
  }

  /**
   * Applies colorblind mode
   */
  private applyColorblindMode(mode: ColorblindMode): void {
    // Apply color filters based on mode
    switch (mode) {
      case ColorblindMode.PROTANOPIA:
        this.applyProtanopiaFilter();
        break;
      case ColorblindMode.DEUTERANOPIA:
        this.applyDeuteranopiaFilter();
        break;
      case ColorblindMode.TRITANOPIA:
        this.applyTritanopiaFilter();
        break;
      case ColorblindMode.NONE:
      default:
        this.removeColorFilters();
        break;
    }
  }

  /**
   * Applies protanopia filter (red-blind)
   */
  private applyProtanopiaFilter(): void {
    // Adjust colors for red-blindness
    // Replace red with blue/yellow alternatives
  }

  /**
   * Applies deuteranopia filter (green-blind)
   */
  private applyDeuteranopiaFilter(): void {
    // Adjust colors for green-blindness
  }

  /**
   * Applies tritanopia filter (blue-blind)
   */
  private applyTritanopiaFilter(): void {
    // Adjust colors for blue-blindness
  }

  /**
   * Removes color filters
   */
  private removeColorFilters(): void {
    // Restore original colors
  }

  /**
   * Applies UI scale
   */
  private applyUIScale(scale: number): void {
    // Scale UI elements
    const uiElements = this.scene.children.list.filter(
      child => (child as any).isUI
    );
    
    uiElements.forEach(element => {
      if ((element as any).setScale) {
        (element as any).setScale(scale);
      }
    });
  }

  /**
   * Shows subtitle for audio cue
   */
  public showSubtitle(text: string, duration: number = 3000): void {
    if (!this.settings.showSubtitles) return;

    const { width, height } = this.scene.cameras.main;
    
    const subtitle = this.scene.add.text(width / 2, height - 100, text, {
      fontSize: `${18 * this.settings.uiScale}px`,
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 15, y: 10 },
      align: 'center',
      wordWrap: { width: width - 100 }
    });
    
    subtitle.setOrigin(0.5);
    subtitle.setDepth(1000);
    subtitle.setScrollFactor(0);
    
    this.scene.time.delayedCall(duration, () => {
      subtitle.destroy();
    });
  }

  /**
   * Shows visual hint alternative
   */
  public showVisualHint(position: { x: number; y: number }, type: string): void {
    if (!this.settings.visualHints) return;

    const icon = this.getHintIcon(type);
    const hint = this.scene.add.text(position.x, position.y, icon, {
      fontSize: `${32 * this.settings.uiScale}px`
    });
    
    hint.setOrigin(0.5);
    hint.setDepth(500);
    
    // Pulse animation
    this.scene.tweens.add({
      targets: hint,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 1, to: 0 },
      duration: 1500,
      onComplete: () => hint.destroy()
    });
  }

  /**
   * Gets hint icon for type
   */
  private getHintIcon(type: string): string {
    const icons: Record<string, string> = {
      'collectible': '✨',
      'puzzle': '🔍',
      'danger': '⚠️',
      'exit': '🚪',
      'ability': '⚡'
    };
    return icons[type] || '💡';
  }

  /**
   * Ensures touch target meets minimum size
   */
  public ensureTouchTarget(
    gameObject: Phaser.GameObjects.GameObject & { width?: number; height?: number }
  ): void {
    const minSize = this.settings.touchTargetSize;
    
    if (gameObject.width && gameObject.width < minSize) {
      (gameObject as any).displayWidth = minSize;
    }
    
    if (gameObject.height && gameObject.height < minSize) {
      (gameObject as any).displayHeight = minSize;
    }
  }

  /**
   * Enables keyboard navigation
   */
  public enableKeyboardNavigation(elements: Phaser.GameObjects.GameObject[]): void {
    if (!this.settings.keyboardNavigation) return;

    let currentIndex = 0;
    
    const navigate = (direction: number) => {
      currentIndex = (currentIndex + direction + elements.length) % elements.length;
      this.highlightElement(elements[currentIndex]);
    };

    this.scene.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      navigate(event.shiftKey ? -1 : 1);
    });

    this.scene.input.keyboard?.on('keydown-ENTER', () => {
      this.activateElement(elements[currentIndex]);
    });
  }

  /**
   * Highlights an element for keyboard navigation
   */
  private highlightElement(element: Phaser.GameObjects.GameObject): void {
    // Add visual highlight
    if ((element as any).setTint) {
      (element as any).setTint(0xffff00);
    }
  }

  /**
   * Activates an element
   */
  private activateElement(element: Phaser.GameObjects.GameObject): void {
    // Trigger click/interaction
    if ((element as any).emit) {
      (element as any).emit('pointerdown');
    }
  }

  /**
   * Gets current settings
   */
  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Checks if reduced motion is enabled
   */
  public isReducedMotion(): boolean {
    return this.settings.reducedMotion;
  }
}

/**
 * Accessibility settings
 */
export interface AccessibilitySettings {
  highContrastMode: boolean;
  colorblindMode: ColorblindMode;
  uiScale: number;
  showSubtitles: boolean;
  visualHints: boolean;
  touchTargetSize: number;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
}

/**
 * Colorblind modes
 */
export enum ColorblindMode {
  NONE = 'NONE',
  PROTANOPIA = 'PROTANOPIA',       // Red-blind
  DEUTERANOPIA = 'DEUTERANOPIA',   // Green-blind
  TRITANOPIA = 'TRITANOPIA'        // Blue-blind
}
