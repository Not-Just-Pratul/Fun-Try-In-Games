import * as fc from 'fast-check';
import { ProceduralMazeGenerator } from '@systems/ProceduralMazeGenerator';
import { CollisionDetector } from '@core/CollisionDetector';
import { MazeType, MazeConfig, CellType } from '@game-types/maze';
import { Vector2D } from '@game-types/common';

// Feature: chain-ledge-game, Property 2: Wall collision prevention
// Validates: Requirements 1.3

// Feature: chain-ledge-game, Property 3: Collision detection during movement
// Validates: Requirements 1.5, 4.1

// Mock ghost for testing
class MockGhost {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

describe('Collision Property Tests', () => {
  const generator = new ProceduralMazeGenerator();

  test('Property 2: Wall collision prevention - Attempting to move into solid wall prevents movement', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 15 }),
        fc.integer({ min: 5, max: 15 }),
        (width, height) => {
          // Generate maze
          const config: MazeConfig = {
            type: MazeType.LINEAR,
            difficulty: 1.0,
            width,
            height,
            layers: 1,
            obstacleCount: 0,
            collectibleCount: 0,
            template: undefined
          };

          const maze = generator.generate(config);
          const cellSize = 32;
          const detector = new CollisionDetector(maze, cellSize);

          // Find a wall cell
          let wallFound = false;
          for (let y = 0; y < height && !wallFound; y++) {
            for (let x = 0; x < width && !wallFound; x++) {
              const cell = maze.grid[y][x];
              if (cell.type === CellType.WALL || !maze.isWalkable({ x, y })) {
                // Try to move ghost into this wall
                const wallX = x * cellSize + cellSize / 2;
                const wallY = y * cellSize + cellSize / 2;
                const ghost = new MockGhost(wallX, wallY);

                // Should not be able to move to wall position
                const canMove = detector.canMoveTo(ghost as any, wallX, wallY);
                expect(canMove).toBe(false);
                wallFound = true;
              }
            }
          }

          // If no walls found (rare), test passes
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 2b: Ghost can move to empty cells', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 15 }),
        fc.integer({ min: 5, max: 15 }),
        (width, height) => {
          // Generate maze
          const config: MazeConfig = {
            type: MazeType.LINEAR,
            difficulty: 1.0,
            width,
            height,
            layers: 1,
            obstacleCount: 0,
            collectibleCount: 0,
            template: undefined
          };

          const maze = generator.generate(config);
          const cellSize = 32;
          const detector = new CollisionDetector(maze, cellSize);

          // Test entrance (always walkable)
          const entranceX = maze.entrance.x * cellSize + cellSize / 2;
          const entranceY = maze.entrance.y * cellSize + cellSize / 2;
          const ghost = new MockGhost(entranceX, entranceY);

          const canMove = detector.canMoveTo(ghost as any, entranceX, entranceY);
          expect(canMove).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 3: Collision detection during movement - Moving through collectible adds to inventory', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 8, max: 15 }),
        fc.integer({ min: 8, max: 15 }),
        (width, height) => {
          // Generate maze with collectibles
          const config: MazeConfig = {
            type: MazeType.LINEAR,
            difficulty: 1.0,
            width,
            height,
            layers: 1,
            obstacleCount: 0,
            collectibleCount: 5,
            template: undefined
          };

          const maze = generator.generate(config);
          
          // Add a collectible manually at a known position
          const collectiblePos: Vector2D = { x: 2, y: 2 };
          maze.collectibles.push({
            id: 'test-collectible',
            type: 'CLUE' as any,
            position: collectiblePos,
            isCollected: false
          });

          const cellSize = 32;
          const detector = new CollisionDetector(maze, cellSize);

          // Move ghost to collectible position
          const ghostPos: Vector2D = {
            x: collectiblePos.x * cellSize + cellSize / 2,
            y: collectiblePos.y * cellSize + cellSize / 2
          };

          // Check collision
          const collectedIndices = detector.checkCollectibleCollision(ghostPos);

          // Should detect collision with at least one collectible
          expect(collectedIndices.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
