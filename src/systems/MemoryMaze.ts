import { Maze, Cell } from '@game-types/maze';
import { Vector2D } from '@game-types/common';

/**
 * MemoryMaze - A maze where paths disappear after the ghost moves away
 */
export class MemoryMaze {
  private maze: Maze;
  private fadeDelayMs: number;
  private visitedCells: Map<string, number>;
  private currentTime: number;

  constructor(maze: Maze, fadeDelayMs: number = 2000) {
    this.maze = maze;
    this.fadeDelayMs = fadeDelayMs;
    this.visitedCells = new Map();
    this.currentTime = 0;
  }

  /**
   * Updates the maze state based on ghost position and elapsed time
   */
  update(ghostPosition: Vector2D, deltaTime: number): void {
    this.currentTime += deltaTime;

    // Mark current position as visited
    const currentKey = this.positionKey(ghostPosition);
    this.visitedCells.set(currentKey, this.currentTime);

    // Make current cell and neighbors visible
    this.updateVisibility(ghostPosition);

    // Fade out cells that were visited long ago
    this.fadeOldCells();
  }

  /**
   * Makes the current cell and immediate neighbors visible
   */
  private updateVisibility(position: Vector2D): void {
    const cell = this.maze.grid[position.y]?.[position.x];
    if (cell) {
      cell.isVisible = true;
      cell.isRevealed = true;

      // Make adjacent cells visible too
      const neighbors = this.getAdjacentPositions(position);
      for (const neighbor of neighbors) {
        const neighborCell = this.maze.grid[neighbor.y]?.[neighbor.x];
        if (neighborCell) {
          neighborCell.isVisible = true;
        }
      }
    }
  }

  /**
   * Fades out cells that haven't been visited recently
   */
  private fadeOldCells(): void {
    for (const [key, visitTime] of this.visitedCells.entries()) {
      const timeSinceVisit = this.currentTime - visitTime;
      
      if (timeSinceVisit > this.fadeDelayMs) {
        const pos = this.parsePositionKey(key);
        const cell = this.maze.grid[pos.y]?.[pos.x];
        if (cell) {
          cell.isVisible = false;
        }
      }
    }
  }

  /**
   * Gets adjacent positions (4-directional)
   */
  private getAdjacentPositions(pos: Vector2D): Vector2D[] {
    const positions: Vector2D[] = [];
    
    if (pos.y > 0) positions.push({ x: pos.x, y: pos.y - 1 });
    if (pos.y < this.maze.height - 1) positions.push({ x: pos.x, y: pos.y + 1 });
    if (pos.x > 0) positions.push({ x: pos.x - 1, y: pos.y });
    if (pos.x < this.maze.width - 1) positions.push({ x: pos.x + 1, y: pos.y });
    
    return positions;
  }

  private positionKey(pos: Vector2D): string {
    return `${pos.x},${pos.y}`;
  }

  private parsePositionKey(key: string): Vector2D {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  getMaze(): Maze {
    return this.maze;
  }
}
