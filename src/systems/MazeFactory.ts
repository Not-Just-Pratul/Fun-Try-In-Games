import { Maze, MazeType, MazeConfig } from '@game-types/maze';
import { ProceduralMazeGenerator } from './ProceduralMazeGenerator';
import { HybridMazeGenerator } from './HybridMazeGenerator';
import { MemoryMaze } from './MemoryMaze';
import { ShadowMaze } from './ShadowMaze';
import { MultiLayeredMaze } from './MultiLayeredMaze';
import { TimeChangingMaze } from './TimeChangingMaze';

/**
 * Factory for creating different types of mazes
 */
export class MazeFactory {
  private proceduralGenerator: ProceduralMazeGenerator;
  private hybridGenerator: HybridMazeGenerator;

  constructor() {
    this.proceduralGenerator = new ProceduralMazeGenerator();
    this.hybridGenerator = new HybridMazeGenerator();
  }

  /**
   * Creates a maze based on the configuration
   */
  createMaze(config: MazeConfig): Maze {
    // Generate base maze
    const baseMaze = config.template
      ? this.hybridGenerator.generate(config)
      : this.proceduralGenerator.generate(config);

    return baseMaze;
  }

  /**
   * Wraps a maze with type-specific behavior
   */
  wrapMaze(maze: Maze): MemoryMaze | ShadowMaze | MultiLayeredMaze | TimeChangingMaze | Maze {
    switch (maze.type) {
      case MazeType.MEMORY:
        return new MemoryMaze(maze);
      
      case MazeType.SHADOW:
        return new ShadowMaze(maze);
      
      case MazeType.MULTI_LAYERED:
        return new MultiLayeredMaze(maze);
      
      case MazeType.TIME_CHANGING:
        return new TimeChangingMaze(maze);
      
      case MazeType.LINEAR:
      default:
        return maze;
    }
  }
}
