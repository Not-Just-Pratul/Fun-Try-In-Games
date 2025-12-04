import { Maze, CellType } from '@game-types/maze';
import { Vector2D } from '@game-types/common';
import { ErrorHandler, ErrorType } from './ErrorHandler';

/**
 * MazeValidator - Validates maze solvability and structure
 */
export class MazeValidator {
  /**
   * Validates that a maze is solvable
   */
  public static isSolvable(maze: Maze): boolean {
    try {
      // Check entrance and exit exist
      if (!maze.entrance || !maze.exit) {
        ErrorHandler.logError(
          ErrorType.MAZE_GENERATION,
          'Maze missing entrance or exit',
          { mazeType: maze.type }
        );
        return false;
      }

      // Check entrance and exit are walkable
      const entranceCell = maze.getCell(maze.entrance);
      const exitCell = maze.getCell(maze.exit);

      if (!entranceCell || entranceCell.type !== CellType.EMPTY) {
        ErrorHandler.logError(
          ErrorType.MAZE_GENERATION,
          'Entrance is not walkable',
          { entrance: maze.entrance }
        );
        return false;
      }

      if (!exitCell || exitCell.type !== CellType.EMPTY) {
        ErrorHandler.logError(
          ErrorType.MAZE_GENERATION,
          'Exit is not walkable',
          { exit: maze.exit }
        );
        return false;
      }

      // Use BFS to check if path exists
      return this.hasPath(maze, maze.entrance, maze.exit);
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        action: 'validate_maze_solvability'
      });
      return false;
    }
  }

  /**
   * Checks if a path exists between two points using BFS
   */
  private static hasPath(maze: Maze, start: Vector2D, end: Vector2D): boolean {
    const visited = new Set<string>();
    const queue: Vector2D[] = [start];
    visited.add(this.positionKey(start));

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check if we reached the end
      if (current.x === end.x && current.y === end.y) {
        return true;
      }

      // Check all neighbors
      const neighbors = this.getNeighbors(current, maze);
      for (const neighbor of neighbors) {
        const key = this.positionKey(neighbor);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }

    return false;
  }

  /**
   * Gets walkable neighbors of a position
   */
  private static getNeighbors(position: Vector2D, maze: Maze): Vector2D[] {
    const neighbors: Vector2D[] = [];
    const directions = [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }  // West
    ];

    for (const dir of directions) {
      const newPos = {
        x: position.x + dir.x,
        y: position.y + dir.y
      };

      // Check bounds
      if (newPos.x < 0 || newPos.x >= maze.width ||
          newPos.y < 0 || newPos.y >= maze.height) {
        continue;
      }

      // Check if walkable
      if (maze.isWalkable(newPos)) {
        neighbors.push(newPos);
      }
    }

    return neighbors;
  }

  /**
   * Creates a unique key for a position
   */
  private static positionKey(position: Vector2D): string {
    return `${position.x},${position.y}`;
  }

  /**
   * Validates maze structure
   */
  public static validateStructure(maze: Maze): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check dimensions
    if (maze.width <= 0 || maze.height <= 0) {
      errors.push('Invalid maze dimensions');
    }

    // Check grid size matches dimensions
    if (maze.grid.length !== maze.height) {
      errors.push(`Grid height mismatch: ${maze.grid.length} vs ${maze.height}`);
    }

    for (let y = 0; y < maze.grid.length; y++) {
      if (maze.grid[y].length !== maze.width) {
        errors.push(`Grid width mismatch at row ${y}: ${maze.grid[y].length} vs ${maze.width}`);
      }
    }

    // Check entrance and exit are different
    if (maze.entrance.x === maze.exit.x && maze.entrance.y === maze.exit.y) {
      errors.push('Entrance and exit are the same position');
    }

    // Check for isolated areas
    const reachableCells = this.countReachableCells(maze);
    const totalWalkableCells = this.countWalkableCells(maze);
    
    if (reachableCells < totalWalkableCells * 0.8) {
      warnings.push(`Only ${reachableCells}/${totalWalkableCells} cells are reachable`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Counts reachable cells from entrance
   */
  private static countReachableCells(maze: Maze): number {
    const visited = new Set<string>();
    const queue: Vector2D[] = [maze.entrance];
    visited.add(this.positionKey(maze.entrance));

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.getNeighbors(current, maze);
      
      for (const neighbor of neighbors) {
        const key = this.positionKey(neighbor);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }

    return visited.size;
  }

  /**
   * Counts total walkable cells
   */
  private static countWalkableCells(maze: Maze): number {
    let count = 0;
    
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (maze.isWalkable({ x, y })) {
          count++;
        }
      }
    }
    
    return count;
  }
}

/**
 * Validation result
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
