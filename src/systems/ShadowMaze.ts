import { Maze, Cell } from '@game-types/maze';
import { Vector2D } from '@game-types/common';

/**
 * ShadowMaze - A maze with limited visibility around the ghost
 */
export class ShadowMaze {
  private maze: Maze;
  private visibilityRadius: number;

  constructor(maze: Maze, visibilityRadius: number = 3) {
    this.maze = maze;
    this.visibilityRadius = visibilityRadius;
    
    // Initially hide all cells
    this.hideAllCells();
  }

  /**
   * Updates visibility based on ghost position
   */
  update(ghostPosition: Vector2D): void {
    // Hide all cells first
    this.hideAllCells();
    
    // Make cells within radius visible
    this.updateVisibility(ghostPosition);
  }

  /**
   * Hides all cells in the maze
   */
  private hideAllCells(): void {
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        this.maze.grid[y][x].isVisible = false;
      }
    }
  }

  /**
   * Makes cells within visibility radius visible
   */
  private updateVisibility(position: Vector2D): void {
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const distance = this.calculateDistance(position, { x, y });
        
        if (distance <= this.visibilityRadius) {
          const cell = this.maze.grid[y][x];
          cell.isVisible = true;
          cell.isRevealed = true; // Once seen, always remembered
        }
      }
    }
  }

  /**
   * Calculates Manhattan distance between two positions
   */
  private calculateDistance(pos1: Vector2D, pos2: Vector2D): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  /**
   * Gets the current visibility radius
   */
  getVisibilityRadius(): number {
    return this.visibilityRadius;
  }

  /**
   * Sets a new visibility radius
   */
  setVisibilityRadius(radius: number): void {
    this.visibilityRadius = Math.max(1, radius);
  }

  getMaze(): Maze {
    return this.maze;
  }
}
