import { Maze, MazeConfig } from '@game-types/maze';

/**
 * Interface for maze generation strategies
 */
export interface MazeGenerator {
  /**
   * Generates a maze based on the provided configuration
   */
  generate(config: MazeConfig): Maze;

  /**
   * Validates that a maze is solvable (has path from entrance to exit)
   */
  validate(maze: Maze): boolean;
}
