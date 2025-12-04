import { Maze, Cell, CellType } from '@game-types/maze';
import { Vector2D } from '@game-types/common';

/**
 * Represents a transition point between layers
 */
export interface LayerTransition {
  position: Vector2D;
  fromLayer: number;
  toLayer: number;
  type: 'stairs' | 'ladder' | 'portal';
}

/**
 * MultiLayeredMaze - A maze with multiple floor levels
 */
export class MultiLayeredMaze {
  private maze: Maze;
  private currentLayer: number;
  private transitions: LayerTransition[];

  constructor(maze: Maze) {
    this.maze = maze;
    this.currentLayer = 0;
    this.transitions = [];
    
    // Generate transitions between layers
    this.generateTransitions();
  }

  /**
   * Attempts to use a transition at the given position
   * Returns true if transition was successful
   */
  useTransition(position: Vector2D): boolean {
    const transition = this.findTransitionAt(position, this.currentLayer);
    
    if (transition) {
      this.currentLayer = transition.toLayer;
      return true;
    }
    
    return false;
  }

  /**
   * Gets the current active layer
   */
  getCurrentLayer(): number {
    return this.currentLayer;
  }

  /**
   * Sets the current layer
   */
  setCurrentLayer(layer: number): void {
    if (layer >= 0 && layer < this.maze.layers) {
      this.currentLayer = layer;
    }
  }

  /**
   * Gets all cells for the current layer
   */
  getCurrentLayerCells(): Cell[][] {
    // In a real implementation, we'd have separate grids per layer
    // For now, we return the main grid
    return this.maze.grid;
  }

  /**
   * Finds a transition at the given position and layer
   */
  private findTransitionAt(position: Vector2D, layer: number): LayerTransition | undefined {
    return this.transitions.find(
      t => t.position.x === position.x && 
           t.position.y === position.y && 
           t.fromLayer === layer
    );
  }

  /**
   * Generates transition points between layers
   */
  private generateTransitions(): void {
    if (this.maze.layers <= 1) return;

    // Create at least one transition per layer pair
    for (let layer = 0; layer < this.maze.layers - 1; layer++) {
      // Place a transition in a random walkable location
      const position = this.findRandomWalkablePosition();
      
      this.transitions.push({
        position,
        fromLayer: layer,
        toLayer: layer + 1,
        type: 'stairs'
      });

      // Add reverse transition
      this.transitions.push({
        position,
        fromLayer: layer + 1,
        toLayer: layer,
        type: 'stairs'
      });
    }
  }

  /**
   * Finds a random walkable position in the maze
   */
  private findRandomWalkablePosition(): Vector2D {
    const walkablePositions: Vector2D[] = [];
    
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const cell = this.maze.grid[y][x];
        if (cell.type === CellType.EMPTY) {
          walkablePositions.push({ x, y });
        }
      }
    }
    
    if (walkablePositions.length === 0) {
      return { x: 0, y: 0 };
    }
    
    const randomIndex = Math.floor(Math.random() * walkablePositions.length);
    return walkablePositions[randomIndex];
  }

  /**
   * Gets all transitions
   */
  getTransitions(): LayerTransition[] {
    return [...this.transitions];
  }

  getMaze(): Maze {
    return this.maze;
  }
}
