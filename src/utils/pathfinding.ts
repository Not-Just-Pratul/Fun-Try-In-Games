import { Vector2D } from '@game-types/common';
import { Maze, Cell } from '@game-types/maze';

/**
 * Finds a path from start to end using BFS (Breadth-First Search)
 * Returns the path as an array of positions, or null if no path exists
 */
export function findPath(
  start: Vector2D,
  end: Vector2D,
  maze: Maze
): Vector2D[] | null {
  const queue: Array<{ pos: Vector2D; path: Vector2D[] }> = [];
  const visited = new Set<string>();

  queue.push({ pos: start, path: [start] });
  visited.add(positionKey(start));

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Check if we reached the end
    if (current.pos.x === end.x && current.pos.y === end.y) {
      return current.path;
    }

    // Explore neighbors
    const neighbors = getWalkableNeighbors(current.pos, maze);
    for (const neighbor of neighbors) {
      const key = positionKey(neighbor);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({
          pos: neighbor,
          path: [...current.path, neighbor]
        });
      }
    }
  }

  return null; // No path found
}

/**
 * Gets all walkable neighboring positions
 */
function getWalkableNeighbors(pos: Vector2D, maze: Maze): Vector2D[] {
  const neighbors: Vector2D[] = [];
  const cell = maze.grid[pos.y]?.[pos.x];

  if (!cell) return neighbors;

  // Check north
  if (!cell.walls.north && pos.y > 0) {
    const northPos = { x: pos.x, y: pos.y - 1 };
    if (maze.isWalkable(northPos)) {
      neighbors.push(northPos);
    }
  }

  // Check south
  if (!cell.walls.south && pos.y < maze.height - 1) {
    const southPos = { x: pos.x, y: pos.y + 1 };
    if (maze.isWalkable(southPos)) {
      neighbors.push(southPos);
    }
  }

  // Check east
  if (!cell.walls.east && pos.x < maze.width - 1) {
    const eastPos = { x: pos.x + 1, y: pos.y };
    if (maze.isWalkable(eastPos)) {
      neighbors.push(eastPos);
    }
  }

  // Check west
  if (!cell.walls.west && pos.x > 0) {
    const westPos = { x: pos.x - 1, y: pos.y };
    if (maze.isWalkable(westPos)) {
      neighbors.push(westPos);
    }
  }

  return neighbors;
}

/**
 * Creates a unique string key for a position
 */
function positionKey(pos: Vector2D): string {
  return `${pos.x},${pos.y}`;
}
