import { Vector2D } from '@game-types/common';

/**
 * SpatialGrid - Optimizes collision detection using spatial partitioning
 */
export class SpatialGrid<T extends { position: Vector2D }> {
  private cellSize: number;
  private grid: Map<string, T[]>;
  private objects: Map<T, string>;

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.objects = new Map();
  }

  /**
   * Adds an object to the grid
   */
  public add(object: T): void {
    const key = this.getKey(object.position);
    
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    
    this.grid.get(key)!.push(object);
    this.objects.set(object, key);
  }

  /**
   * Removes an object from the grid
   */
  public remove(object: T): void {
    const key = this.objects.get(object);
    
    if (key) {
      const cell = this.grid.get(key);
      if (cell) {
        const index = cell.indexOf(object);
        if (index !== -1) {
          cell.splice(index, 1);
        }
        
        // Clean up empty cells
        if (cell.length === 0) {
          this.grid.delete(key);
        }
      }
      
      this.objects.delete(object);
    }
  }

  /**
   * Updates an object's position in the grid
   */
  public update(object: T): void {
    const oldKey = this.objects.get(object);
    const newKey = this.getKey(object.position);
    
    if (oldKey !== newKey) {
      this.remove(object);
      this.add(object);
    }
  }

  /**
   * Gets objects near a position
   */
  public getNearby(position: Vector2D, radius: number = 1): T[] {
    const nearby: T[] = [];
    const cellRadius = Math.ceil(radius);
    const centerCell = this.getCellCoords(position);
    
    for (let x = centerCell.x - cellRadius; x <= centerCell.x + cellRadius; x++) {
      for (let y = centerCell.y - cellRadius; y <= centerCell.y + cellRadius; y++) {
        const key = `${x},${y}`;
        const cell = this.grid.get(key);
        
        if (cell) {
          nearby.push(...cell);
        }
      }
    }
    
    return nearby;
  }

  /**
   * Gets objects in a specific cell
   */
  public getCell(position: Vector2D): T[] {
    const key = this.getKey(position);
    return this.grid.get(key) || [];
  }

  /**
   * Clears the grid
   */
  public clear(): void {
    this.grid.clear();
    this.objects.clear();
  }

  /**
   * Gets the number of objects in the grid
   */
  public size(): number {
    return this.objects.size;
  }

  /**
   * Gets cell key for a position
   */
  private getKey(position: Vector2D): string {
    const coords = this.getCellCoords(position);
    return `${coords.x},${coords.y}`;
  }

  /**
   * Gets cell coordinates for a position
   */
  private getCellCoords(position: Vector2D): Vector2D {
    return {
      x: Math.floor(position.x / this.cellSize),
      y: Math.floor(position.y / this.cellSize)
    };
  }
}
