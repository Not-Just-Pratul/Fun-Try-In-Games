import { Maze, Cell, CellType } from '@game-types/maze';
import { Vector2D } from '@game-types/common';

/**
 * TimeChangingMaze - A maze where walls transform dynamically
 */
export class TimeChangingMaze {
  private maze: Maze;
  private changeIntervalMs: number;
  private lastChangeTime: number;
  private currentTime: number;
  private changingWalls: Vector2D[];

  constructor(maze: Maze, changeIntervalMs: number = 5000) {
    this.maze = maze;
    this.changeIntervalMs = changeIntervalMs;
    this.lastChangeTime = 0;
    this.currentTime = 0;
    this.changingWalls = [];
    
    // Identify walls that can change
    this.identifyChangingWalls();
  }

  /**
   * Updates the maze state based on elapsed time
   */
  update(deltaTime: number): void {
    this.currentTime += deltaTime;
    
    const timeSinceLastChange = this.currentTime - this.lastChangeTime;
    
    if (timeSinceLastChange >= this.changeIntervalMs) {
      this.transformWalls();
      this.lastChangeTime = this.currentTime;
    }
  }

  /**
   * Identifies walls that can transform
   */
  private identifyChangingWalls(): void {
    for (let y = 1; y < this.maze.height - 1; y++) {
      for (let x = 1; x < this.maze.width - 1; x++) {
        const cell = this.maze.grid[y][x];
        
        // Mark some walls as changeable (not on borders)
        if (Math.random() < 0.2) { // 20% of cells can change
          this.changingWalls.push({ x, y });
        }
      }
    }
  }

  /**
   * Transforms some walls in the maze
   */
  private transformWalls(): void {
    // Transform a subset of changing walls
    const wallsToChange = Math.floor(this.changingWalls.length * 0.3);
    
    for (let i = 0; i < wallsToChange; i++) {
      const randomIndex = Math.floor(Math.random() * this.changingWalls.length);
      const pos = this.changingWalls[randomIndex];
      const cell = this.maze.grid[pos.y][pos.x];
      
      // Toggle wall state
      if (cell.type === CellType.WALL) {
        cell.type = CellType.EMPTY;
      } else if (cell.type === CellType.EMPTY) {
        // Only make it a wall if it won't block the path completely
        if (this.canSafelyAddWall(pos)) {
          cell.type = CellType.WALL;
        }
      }
    }
  }

  /**
   * Checks if adding a wall at position won't make maze unsolvable
   */
  private canSafelyAddWall(position: Vector2D): boolean {
    // Simple check: ensure at least 2 adjacent cells are walkable
    const adjacentWalkable = this.countAdjacentWalkable(position);
    return adjacentWalkable >= 2;
  }

  /**
   * Counts walkable adjacent cells
   */
  private countAdjacentWalkable(pos: Vector2D): number {
    let count = 0;
    
    const neighbors = [
      { x: pos.x, y: pos.y - 1 },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x + 1, y: pos.y }
    ];
    
    for (const neighbor of neighbors) {
      if (neighbor.x >= 0 && neighbor.x < this.maze.width &&
          neighbor.y >= 0 && neighbor.y < this.maze.height) {
        const cell = this.maze.grid[neighbor.y][neighbor.x];
        if (cell.type === CellType.EMPTY) {
          count++;
        }
      }
    }
    
    return count;
  }

  /**
   * Gets the time until next change
   */
  getTimeUntilNextChange(): number {
    const timeSinceLastChange = this.currentTime - this.lastChangeTime;
    return Math.max(0, this.changeIntervalMs - timeSinceLastChange);
  }

  getMaze(): Maze {
    return this.maze;
  }
}
