/**
 * LocalizationManager - Manages translations and localization
 */
export class LocalizationManager {
  private currentLanguage: string = 'en';
  private translations: Map<string, LanguageData> = new Map();
  private fallbackLanguage: string = 'en';

  constructor() {
    this.loadLanguages();
  }

  /**
   * Loads language data
   */
  private loadLanguages(): void {
    // Load English (default)
    this.translations.set('en', {
      ui: {
        play: 'Play',
        continue: 'Continue',
        settings: 'Settings',
        quit: 'Quit',
        pause: 'Pause',
        resume: 'Resume',
        restart: 'Restart',
        mainMenu: 'Main Menu',
        levelSelect: 'Level Select',
        customize: 'Customize',
        shop: 'Shop'
      },
      gameplay: {
        objective: 'Objective',
        collectKeys: 'Collect all keys',
        solvePuzzles: 'Solve puzzles',
        reachExit: 'Reach the exit',
        hint: 'Hint',
        abilityReady: 'Ability Ready',
        abilityOnCooldown: 'Ability on Cooldown'
      },
      abilities: {
        phase: 'Phase',
        possess: 'Possess',
        sense: 'Sense',
        speedBoost: 'Speed Boost',
        phaseDesc: 'Pass through walls',
        possessDesc: 'Control objects',
        senseDesc: 'Reveal hidden paths',
        speedBoostDesc: 'Move faster'
      },
      messages: {
        levelComplete: 'Level Complete!',
        gameOver: 'Game Over',
        puzzleSolved: 'Puzzle Solved!',
        itemCollected: 'Item Collected',
        guardDetected: 'Guard Detected!',
        trapTriggered: 'Trap Triggered!'
      }
    });

    // Load Spanish
    this.translations.set('es', {
      ui: {
        play: 'Jugar',
        continue: 'Continuar',
        settings: 'Configuración',
        quit: 'Salir',
        pause: 'Pausa',
        resume: 'Reanudar',
        restart: 'Reiniciar',
        mainMenu: 'Menú Principal',
        levelSelect: 'Seleccionar Nivel',
        customize: 'Personalizar',
        shop: 'Tienda'
      },
      gameplay: {
        objective: 'Objetivo',
        collectKeys: 'Recoger todas las llaves',
        solvePuzzles: 'Resolver acertijos',
        reachExit: 'Llegar a la salida',
        hint: 'Pista',
        abilityReady: 'Habilidad Lista',
        abilityOnCooldown: 'Habilidad en Espera'
      },
      abilities: {
        phase: 'Fase',
        possess: 'Poseer',
        sense: 'Sentir',
        speedBoost: 'Impulso de Velocidad',
        phaseDesc: 'Atravesar paredes',
        possessDesc: 'Controlar objetos',
        senseDesc: 'Revelar caminos ocultos',
        speedBoostDesc: 'Moverse más rápido'
      },
      messages: {
        levelComplete: '¡Nivel Completado!',
        gameOver: 'Juego Terminado',
        puzzleSolved: '¡Acertijo Resuelto!',
        itemCollected: 'Objeto Recogido',
        guardDetected: '¡Guardia Detectado!',
        trapTriggered: '¡Trampa Activada!'
      }
    });

    // Load Chinese (Simplified)
    this.translations.set('zh', {
      ui: {
        play: '开始游戏',
        continue: '继续',
        settings: '设置',
        quit: '退出',
        pause: '暂停',
        resume: '继续',
        restart: '重新开始',
        mainMenu: '主菜单',
        levelSelect: '选择关卡',
        customize: '自定义',
        shop: '商店'
      },
      gameplay: {
        objective: '目标',
        collectKeys: '收集所有钥匙',
        solvePuzzles: '解决谜题',
        reachExit: '到达出口',
        hint: '提示',
        abilityReady: '技能准备就绪',
        abilityOnCooldown: '技能冷却中'
      },
      abilities: {
        phase: '相位',
        possess: '附身',
        sense: '感知',
        speedBoost: '加速',
        phaseDesc: '穿过墙壁',
        possessDesc: '控制物体',
        senseDesc: '显示隐藏路径',
        speedBoostDesc: '移动更快'
      },
      messages: {
        levelComplete: '关卡完成！',
        gameOver: '游戏结束',
        puzzleSolved: '谜题已解决！',
        itemCollected: '物品已收集',
        guardDetected: '守卫发现！',
        trapTriggered: '陷阱触发！'
      }
    });
  }

  /**
   * Sets the current language
   */
  public setLanguage(languageCode: string): boolean {
    if (this.translations.has(languageCode)) {
      this.currentLanguage = languageCode;
      return true;
    }
    return false;
  }

  /**
   * Gets a translated string
   */
  public get(key: string): string {
    const keys = key.split('.');
    let data: any = this.translations.get(this.currentLanguage);
    
    if (!data) {
      data = this.translations.get(this.fallbackLanguage);
    }
    
    for (const k of keys) {
      if (data && typeof data === 'object' && k in data) {
        data = data[k];
      } else {
        // Fallback to English
        data = this.translations.get(this.fallbackLanguage);
        for (const fk of keys) {
          if (data && typeof data === 'object' && fk in data) {
            data = data[fk];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }
    
    return typeof data === 'string' ? data : key;
  }

  /**
   * Gets translated string with parameters
   */
  public format(key: string, params: Record<string, string | number>): string {
    let text = this.get(key);
    
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, String(value));
    });
    
    return text;
  }

  /**
   * Gets current language
   */
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Gets available languages
   */
  public getAvailableLanguages(): LanguageInfo[] {
    return [
      { code: 'en', name: 'English', nativeName: 'English', rtl: false },
      { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
      { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false }
    ];
  }

  /**
   * Checks if current language is RTL
   */
  public isRTL(): boolean {
    const lang = this.getAvailableLanguages().find(l => l.code === this.currentLanguage);
    return lang?.rtl || false;
  }

  /**
   * Formats date according to locale
   */
  public formatDate(date: Date): string {
    try {
      return new Intl.DateTimeFormat(this.currentLanguage).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  }

  /**
   * Formats time according to locale
   */
  public formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Language data structure
 */
export interface LanguageData {
  ui: Record<string, string>;
  gameplay: Record<string, string>;
  abilities: Record<string, string>;
  messages: Record<string, string>;
}

/**
 * Language information
 */
export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}
