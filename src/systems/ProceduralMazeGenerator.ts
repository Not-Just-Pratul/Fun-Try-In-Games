import { MazeGenerator } from '@core/MazeGenerator';
import { Maze, MazeConfig, Cell, CellType } from '@game-types/maze';
import { Vector2D } from '@game-types/common';
import { findPath } from '@utils/pathfinding';

/**
 * Generates mazes using recursive backtracking algorithm
 */
export class ProceduralMazeGenerator implements MazeGenerator {
  generate(config: MazeConfig): Maze {
    const grid = this.initializeGrid(config.width, config.height);
    
    // Generate maze using recursive backtracking
    this.recursiveBacktrack(grid, 0, 0);
    
    // Set entrance and exit
    const entrance: Vector2D = { x: 0, y: 0 };
    const exit: Vector2D = { x: config.width - 1, y: config.height - 1 };
    
    const maze: Maze = {
      type: config.type,
      grid,
      width: config.width,
      height: config.height,
      layers: config.layers,
      entrance,
      exit,
      obstacles: [],
      collectibles: [],
      getCell: (pos: Vector2D) => grid[pos.y]?.[pos.x],
      isWalkable: (pos: Vector2D) => {
        const cell = grid[pos.y]?.[pos.x];
        return cell ? cell.type !== CellType.WALL : false;
      },
      isSolvable: () => this.validate(maze)
    };
    
    return maze;
  }

  validate(maze: Maze): boolean {
    const path = findPath(maze.entrance, maze.exit, maze);
    return path !== null;
  }

  /**
   * Initializes a grid with all walls
   */
  private initializeGrid(width: number, height: number): Cell[][] {
    const grid: Cell[][] = [];
    
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        grid[y][x] = {
          position: { x, y },
          type: CellType.EMPTY,
          walls: { north: true, south: true, east: true, west: true },
          isVisible: true,
          isRevealed: false
        };
      }
    }
    
    return grid;
  }

  /**
   * Recursive backtracking algorithm to generate maze
   */
  private recursiveBacktrack(grid: Cell[][], x: number, y: number): void {
    const height = grid.length;
    const width = grid[0].length;
    const current = grid[y][x];
    current.isRevealed = true;

    // Define directions in random order
    const directions = this.shuffleArray([
      { dx: 0, dy: -1, wall: 'north', opposite: 'south' },  // North
      { dx: 0, dy: 1, wall: 'south', opposite: 'north' },   // South
      { dx: 1, dy: 0, wall: 'east', opposite: 'west' },     // East
      { dx: -1, dy: 0, wall: 'west', opposite: 'east' }     // West
    ]);

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      // Check if neighbor is within bounds
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighbor = grid[ny][nx];

        // If neighbor hasn't been visited
        if (!neighbor.isRevealed) {
          // Remove walls between current and neighbor
          current.walls[dir.wall as keyof typeof current.walls] = false;
          neighbor.walls[dir.opposite as keyof typeof neighbor.walls] = false;

          // Recursively visit neighbor
          this.recursiveBacktrack(grid, nx, ny);
        }
      }
    }
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
