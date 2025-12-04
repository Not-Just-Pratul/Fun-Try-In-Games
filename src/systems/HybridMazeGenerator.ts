import { MazeGenerator } from '@core/MazeGenerator';
import { Maze, MazeConfig, Cell } from '@game-types/maze';
import { ProceduralMazeGenerator } from './ProceduralMazeGenerator';
import { findPath } from '@utils/pathfinding';

/**
 * Generates mazes by combining procedural generation with handcrafted templates
 */
export class HybridMazeGenerator implements MazeGenerator {
  private proceduralGenerator: ProceduralMazeGenerator;

  constructor() {
    this.proceduralGenerator = new ProceduralMazeGenerator();
  }

  generate(config: MazeConfig): Maze {
    // If a template is provided, use it as the base
    if (config.template) {
      return this.generateFromTemplate(config);
    }

    // Otherwise, use procedural generation
    return this.proceduralGenerator.generate(config);
  }

  validate(maze: Maze): boolean {
    const path = findPath(maze.entrance, maze.exit, maze);
    return path !== null;
  }

  /**
   * Generates a maze from a template with some procedural modifications
   */
  private generateFromTemplate(config: MazeConfig): Maze {
    if (!config.template) {
      throw new Error('Template is required for template-based generation');
    }

    // Clone the template grid
    const grid: Cell[][] = config.template.grid.map(row =>
      row.map(cell => ({ ...cell, walls: { ...cell.walls } }))
    );

    const maze: Maze = {
      type: config.type,
      grid,
      width: config.width,
      height: config.height,
      layers: config.layers,
      entrance: { x: 0, y: 0 },
      exit: { x: config.width - 1, y: config.height - 1 },
      obstacles: [],
      collectibles: [],
      getCell: (pos) => grid[pos.y]?.[pos.x],
      isWalkable: (pos) => {
        const cell = grid[pos.y]?.[pos.x];
        return cell ? cell.type !== 'WALL' : false;
      },
      isSolvable: () => this.validate(maze)
    };

    return maze;
  }
}
