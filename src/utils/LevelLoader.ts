import { LevelConfig } from '@game-types/level';
import { MazeType } from '@game-types/maze';

/**
 * LevelLoader - Loads level configurations from JSON data
 */
export class LevelLoader {
  private static levelCache: Map<string, LevelConfig> = new Map();

  /**
   * Loads a level configuration by ID
   */
  public static async loadLevel(levelId: string): Promise<LevelConfig | null> {
    // Check cache first
    if (this.levelCache.has(levelId)) {
      return this.levelCache.get(levelId)!;
    }

    try {
      // In a real implementation, this would fetch from JSON files
      // For now, return mock data based on levelId
      const config = this.getMockLevelConfig(levelId);
      
      if (config) {
        this.levelCache.set(levelId, config);
      }
      
      return config;
    } catch (error) {
      console.error(`Failed to load level ${levelId}:`, error);
      return null;
    }
  }

  /**
   * Loads all levels for a chapter
   */
  public static async loadChapter(chapterNumber: number): Promise<LevelConfig[]> {
    const levels: LevelConfig[] = [];
    
    // Load levels for this chapter
    for (let i = 1; i <= 5; i++) {
      const levelId = `chapter${chapterNumber}-level${i}`;
      const config = await this.loadLevel(levelId);
      
      if (config) {
        levels.push(config);
      }
    }
    
    return levels;
  }

  /**
   * Gets mock level configuration (temporary)
   */
  private static getMockLevelConfig(levelId: string): LevelConfig | null {
    const configs: Record<string, LevelConfig> = {
      'tutorial': {
        id: 'tutorial',
        chapterNumber: 0,
        mazeConfig: {
          type: MazeType.LINEAR,
          difficulty: 0.5,
          width: 10,
          height: 8,
          layers: 1,
          obstacleCount: 1,
          collectibleCount: 3
        },
        requiredPuzzles: ['tutorial-collection-1'],
        storyMemoryId: 'tutorial-memory'
      },
      'chapter1-level1': {
        id: 'chapter1-level1',
        chapterNumber: 1,
        mazeConfig: {
          type: MazeType.LINEAR,
          difficulty: 1.0,
          width: 15,
          height: 12,
          layers: 1,
          obstacleCount: 2,
          collectibleCount: 5
        },
        requiredPuzzles: ['ch1-l1-collection', 'ch1-l1-possession'],
        storyMemoryId: 'memory-1'
      },
      'chapter1-level2': {
        id: 'chapter1-level2',
        chapterNumber: 1,
        mazeConfig: {
          type: MazeType.SHADOW,
          difficulty: 1.5,
          width: 18,
          height: 15,
          layers: 1,
          obstacleCount: 3,
          collectibleCount: 6
        },
        requiredPuzzles: ['ch1-l2-collection'],
        storyMemoryId: 'memory-2'
      },
      'chapter1-level3': {
        id: 'chapter1-level3',
        chapterNumber: 1,
        mazeConfig: {
          type: MazeType.LINEAR,
          difficulty: 2.0,
          width: 20,
          height: 16,
          layers: 1,
          obstacleCount: 4,
          collectibleCount: 8
        },
        requiredPuzzles: ['ch1-l3-sequence', 'ch1-l3-timing'],
        storyMemoryId: 'memory-3'
      },
      'chapter1-level4': {
        id: 'chapter1-level4',
        chapterNumber: 1,
        mazeConfig: {
          type: MazeType.MEMORY,
          difficulty: 2.5,
          width: 22,
          height: 18,
          layers: 1,
          obstacleCount: 5,
          collectibleCount: 10
        },
        requiredPuzzles: ['ch1-l4-collection', 'ch1-l4-possession'],
        storyMemoryId: 'memory-4'
      },
      'chapter1-level5': {
        id: 'chapter1-level5',
        chapterNumber: 1,
        mazeConfig: {
          type: MazeType.MULTI_LAYERED,
          difficulty: 3.0,
          width: 24,
          height: 20,
          layers: 2,
          obstacleCount: 6,
          collectibleCount: 12
        },
        requiredPuzzles: ['ch1-l5-sequence', 'ch1-l5-timing', 'ch1-l5-collection'],
        storyMemoryId: 'memory-5'
      }
    };

    return configs[levelId] || null;
  }

  /**
   * Clears the level cache
   */
  public static clearCache(): void {
    this.levelCache.clear();
  }

  /**
   * Gets all available level IDs
   */
  public static getAllLevelIds(): string[] {
    return [
      'tutorial',
      'chapter1-level1',
      'chapter1-level2',
      'chapter1-level3',
      'chapter1-level4',
      'chapter1-level5'
    ];
  }

  /**
   * Gets level IDs for a specific chapter
   */
  public static getChapterLevelIds(chapterNumber: number): string[] {
    if (chapterNumber === 0) {
      return ['tutorial'];
    }
    
    return [
      `chapter${chapterNumber}-level1`,
      `chapter${chapterNumber}-level2`,
      `chapter${chapterNumber}-level3`,
      `chapter${chapterNumber}-level4`,
      `chapter${chapterNumber}-level5`
    ];
  }
}
