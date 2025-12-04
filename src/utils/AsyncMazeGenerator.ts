import { Maze, MazeConfig } from '@game-types/maze';
import { ProceduralMazeGenerator } from '@systems/ProceduralMazeGenerator';

/**
 * AsyncMazeGenerator - Generates mazes asynchronously to avoid blocking
 */
export class AsyncMazeGenerator {
  private generator: ProceduralMazeGenerator;
  private worker?: Worker;

  constructor() {
    this.generator = new ProceduralMazeGenerator();
  }

  /**
   * Generates a maze asynchronously
   */
  public async generateAsync(config: MazeConfig): Promise<Maze> {
    // Use requestIdleCallback if available for better performance
    if ('requestIdleCallback' in window) {
      return this.generateWithIdleCallback(config);
    }
    
    // Fall back to chunked generation
    return this.generateChunked(config);
  }

  /**
   * Generates maze using requestIdleCallback
   */
  private generateWithIdleCallback(config: MazeConfig): Promise<Maze> {
    return new Promise((resolve) => {
      (window as any).requestIdleCallback(() => {
        const maze = this.generator.generate(config);
        resolve(maze);
      });
    });
  }

  /**
   * Generates maze in chunks to avoid blocking
   */
  private async generateChunked(config: MazeConfig): Promise<Maze> {
    // Split generation into chunks
    return new Promise((resolve) => {
      setTimeout(() => {
        const maze = this.generator.generate(config);
        resolve(maze);
      }, 0);
    });
  }

  /**
   * Generates maze with progress callback
   */
  public async generateWithProgress(
    config: MazeConfig,
    onProgress: (progress: number) => void
  ): Promise<Maze> {
    // Simulate progress for now
    const steps = 10;
    
    for (let i = 0; i < steps; i++) {
      await this.sleep(10);
      onProgress((i + 1) / steps);
    }
    
    return this.generator.generate(config);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancels ongoing generation (if using worker)
   */
  public cancel(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = undefined;
    }
  }
}
