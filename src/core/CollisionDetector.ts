import { Vector2D } from '@game-types/common';
import { Maze } from '@game-types/maze';
import { GhostCharacter } from '@components/GhostCharacter';

/**
 * CollisionDetector - Handles collision detection between game entities
 */
export class CollisionDetector {
  private maze: Maze;
  private cellSize: number;
  public mazeOffsetX: number = 0;
  public mazeOffsetY: number = 0;

  constructor(maze: Maze, cellSize: number = 32) {
    this.maze = maze;
    this.cellSize = cellSize;
  }

  /**
   * Checks if a position collides with a wall
   */
  checkWallCollision(position: Vector2D): boolean {
    // Adjust for maze offset
    const adjustedX = position.x - this.mazeOffsetX;
    const adjustedY = position.y - this.mazeOffsetY;
    
    const gridX = Math.floor(adjustedX / this.cellSize);
    const gridY = Math.floor(adjustedY / this.cellSize);

    // Check if position is within maze bounds
    if (gridX < 0 || gridX >= this.maze.width || 
        gridY < 0 || gridY >= this.maze.height) {
      return true; // Out of bounds = collision
    }

    // Get the cell
    const cell = this.maze.grid[gridY]?.[gridX];
    if (!cell) return true;

    // Check if cell itself is a wall
    if (!this.maze.isWalkable({ x: gridX, y: gridY })) {
      return true;
    }

    // Check if we're near a wall edge within the cell
    const cellX = adjustedX - (gridX * this.cellSize);
    const cellY = adjustedY - (gridY * this.cellSize);
    const wallThickness = 2;

    // Check north wall
    if (cell.walls.north && cellY < wallThickness) {
      return true;
    }
    // Check south wall
    if (cell.walls.south && cellY > this.cellSize - wallThickness) {
      return true;
    }
    // Check west wall
    if (cell.walls.west && cellX < wallThickness) {
      return true;
    }
    // Check east wall
    if (cell.walls.east && cellX > this.cellSize - wallThickness) {
      return true;
    }

    return false;
  }

  /**
   * Checks if the ghost can move to a new position
   */
  canMoveTo(ghost: GhostCharacter, newX: number, newY: number): boolean {
    // Check corners of the ghost sprite
    const radius = 12; // Ghost radius
    const positions = [
      { x: newX, y: newY }, // Center
      { x: newX - radius, y: newY - radius }, // Top-left
      { x: newX + radius, y: newY - radius }, // Top-right
      { x: newX - radius, y: newY + radius }, // Bottom-left
      { x: newX + radius, y: newY + radius }  // Bottom-right
    ];

    // Check if any corner collides with a wall
    for (const pos of positions) {
      if (this.checkWallCollision(pos)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks collision with collectibles
   */
  checkCollectibleCollision(ghostPosition: Vector2D): number[] {
    const collectedIndices: number[] = [];
    const collisionRadius = 20;

    this.maze.collectibles.forEach((collectible, index) => {
      if (collectible.isCollected) return;

      const collectibleX = collectible.position.x * this.cellSize + this.cellSize / 2;
      const collectibleY = collectible.position.y * this.cellSize + this.cellSize / 2;

      const distance = Math.sqrt(
        Math.pow(ghostPosition.x - collectibleX, 2) +
        Math.pow(ghostPosition.y - collectibleY, 2)
      );

      if (distance < collisionRadius) {
        collectedIndices.push(index);
      }
    });

    return collectedIndices;
  }

  /**
   * Checks if ghost reached the exit
   */
  checkExitCollision(ghostPosition: Vector2D): boolean {
    const exitX = this.mazeOffsetX + this.maze.exit.x * this.cellSize + this.cellSize / 2;
    const exitY = this.mazeOffsetY + this.maze.exit.y * this.cellSize + this.cellSize / 2;
    const collisionRadius = 20;

    const distance = Math.sqrt(
      Math.pow(ghostPosition.x - exitX, 2) +
      Math.pow(ghostPosition.y - exitY, 2)
    );

    return distance < collisionRadius;
  }

  /**
   * Updates the maze reference
   */
  setMaze(maze: Maze): void {
    this.maze = maze;
  }
}
