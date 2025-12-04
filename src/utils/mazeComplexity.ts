import { Maze, MazeConfig } from '@game-types/maze';

/**
 * Calculates the complexity score of a maze configuration
 * Higher scores indicate more complex mazes
 */
export function calculateMazeComplexity(config: MazeConfig): number {
  let complexity = 0;

  // Base complexity from size
  complexity += config.width * config.height * 0.1;

  // Add complexity for layers
  complexity += config.layers * 10;

  // Add complexity for obstacles
  complexity += config.obstacleCount * 5;

  // Add complexity for collectibles (minor factor)
  complexity += config.collectibleCount * 2;

  // Difficulty multiplier
  complexity *= config.difficulty;

  return Math.round(complexity);
}

/**
 * Calculates the actual complexity of a generated maze
 */
export function calculateActualComplexity(maze: Maze): number {
  let complexity = 0;

  // Base complexity from size
  complexity += maze.width * maze.height * 0.1;

  // Add complexity for layers
  complexity += maze.layers * 10;

  // Add complexity for obstacles
  complexity += maze.obstacles.length * 5;

  // Add complexity for collectibles
  complexity += maze.collectibles.length * 2;

  return Math.round(complexity);
}
